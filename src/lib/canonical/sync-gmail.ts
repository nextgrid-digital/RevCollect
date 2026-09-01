import type { Customer, ThreadEmail } from '@/features/revcollect/types';
import {
  fetchGmailMessageThreadId,
  fetchGmailThreadMessages,
  GmailNotConnectedError,
  getConnectedGmailEmail,
  searchGmailByQuery,
  searchGmailFromAddress
} from '@/lib/integrations/gmail-api';
import { getGmailConnection } from '@/lib/integrations/gmail-connection-store';
import { overlayInboxWithSentEmails } from './sent-emails';
import { getCanonicalStore } from './store';

const GMAIL_SYNC_TTL_MS = 45_000;
const PLACEHOLDER_EMAIL = 'no-email@xero.local';
const lastSyncAt = new Map<string, number>();
const inFlight = new Map<string, Promise<boolean>>();
const syncInFlight = new Map<string, Promise<boolean>>();

function isUsableCustomerEmail(email: string, connectedEmail: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@') || normalized === PLACEHOLDER_EMAIL) {
    return false;
  }
  return normalized !== connectedEmail.trim().toLowerCase();
}

function authorForCustomerThread(input: {
  messageId: string;
  fromEmails: string[];
  mappedAuthor: 'agent' | 'customer';
  customerEmail: string;
  knownAgentIds: Set<string>;
}): 'agent' | 'customer' {
  if (input.knownAgentIds.has(input.messageId)) return 'agent';
  const customer = input.customerEmail.trim().toLowerCase();
  if (customer && input.fromEmails.some((email) => email.toLowerCase() === customer)) {
    return 'customer';
  }
  return input.mappedAuthor;
}

function mergeThreadEmails(existing: ThreadEmail[], incoming: ThreadEmail[]): ThreadEmail[] {
  const byId = new Map(existing.map((email) => [email.id, email]));
  for (const email of incoming) {
    const previous = byId.get(email.id);
    byId.set(email.id, previous ? { ...previous, ...email } : email);
  }
  return [...byId.values()];
}

function stripReplyPrefix(subject: string): string {
  return subject.replace(/^((re|fwd|fw)\s*:\s*)+/i, '').trim();
}

function gmailSubjectQuery(subject: string): string {
  const cleaned = stripReplyPrefix(subject).replace(/"/g, '').trim();
  if (!cleaned) return '';
  return `subject:"${cleaned}" newer_than:90d`;
}

function emailsNeedWrite(existing: ThreadEmail[], incoming: ThreadEmail[]): boolean {
  const byId = new Map(existing.map((email) => [email.id, email]));
  for (const email of incoming) {
    const previous = byId.get(email.id);
    if (!previous) return true;
    if (previous.author !== email.author) return true;
    if (!previous.gmailThreadId && email.gmailThreadId) return true;
  }
  return false;
}

async function syncGmailThreadsOnce(tenantId: string): Promise<boolean> {
  const connection = await getGmailConnection(tenantId);
  if (!connection) return false;

  const connectedEmail = await getConnectedGmailEmail(tenantId);
  if (!connectedEmail) return false;

  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const existing = snapshot.sentEmails ?? [];
  const incoming: ThreadEmail[] = [];
  const knownAgentIds = new Set(
    existing.filter((email) => email.author === 'agent').map((email) => email.id)
  );
  const customerById = new Map(
    (snapshot.customers as Customer[]).map((customer) => [customer.id, customer])
  );

  const threadOwners = new Map<string, { customerId: string; threadId: string }>();
  for (const email of existing) {
    if (!email.customerId) continue;
    let gmailThreadId = email.gmailThreadId;
    if (!gmailThreadId && email.author === 'agent') {
      try {
        gmailThreadId = (await fetchGmailMessageThreadId(tenantId, email.id)) ?? undefined;
      } catch (error) {
        console.error('[gmail] could not resolve thread for sent message:', email.id, error);
      }
    }
    if (!gmailThreadId) continue;
    threadOwners.set(gmailThreadId, {
      customerId: email.customerId,
      threadId: email.threadId
    });
  }

  for (const [gmailThreadId, owner] of threadOwners) {
    const messages = await fetchGmailThreadMessages(tenantId, gmailThreadId);
    const customerEmail = customerById.get(owner.customerId)?.email ?? '';
    for (const message of messages) {
      incoming.push({
        id: message.id,
        threadId: owner.threadId,
        customerId: owner.customerId,
        gmailThreadId: message.gmailThreadId ?? gmailThreadId,
        author: authorForCustomerThread({
          messageId: message.id,
          fromEmails: message.fromEmails,
          mappedAuthor: message.author,
          customerEmail,
          knownAgentIds
        }),
        from: message.from,
        to: message.to,
        subject: message.subject,
        body: message.body,
        sentAt: message.sentAt
      });
    }
  }

  const customersWithThread = new Set([...threadOwners.values()].map((owner) => owner.customerId));
  const customers = snapshot.customers as Customer[];
  for (const customer of customers) {
    if (customersWithThread.has(customer.id)) continue;
    if (!isUsableCustomerEmail(customer.email, connectedEmail)) continue;
    const messages = await searchGmailFromAddress(tenantId, customer.email.trim());
    const threadId = `xero-customer-${customer.id}`;
    for (const message of messages) {
      incoming.push({
        id: message.id,
        threadId,
        customerId: customer.id,
        gmailThreadId: message.gmailThreadId,
        author: message.author,
        from: message.from,
        to: message.to.length > 0 ? message.to : [connectedEmail],
        subject: message.subject,
        body: message.body,
        sentAt: message.sentAt
      });
    }
  }

  const connected = connectedEmail.trim().toLowerCase();
  for (const customer of customers) {
    if (customer.email.trim().toLowerCase() !== connected) continue;
    const agentEmails = existing.filter(
      (email) => email.customerId === customer.id && email.author === 'agent'
    );
    if (agentEmails.length === 0) continue;

    const agentIdsForCustomer = new Set(agentEmails.map((email) => email.id));
    const lastAgentAt = agentEmails.reduce(
      (latest, email) => (email.sentAt > latest ? email.sentAt : latest),
      agentEmails[0].sentAt
    );
    const lastAgentMs = Date.parse(lastAgentAt);
    const subjects = [
      ...new Set(agentEmails.map((email) => stripReplyPrefix(email.subject)).filter(Boolean))
    ];
    const threadId = agentEmails[0].threadId || `xero-customer-${customer.id}`;
    const seenThreadIds = new Set<string>();

    for (const subject of subjects) {
      const query = gmailSubjectQuery(subject);
      if (!query) continue;
      const messages = await searchGmailByQuery(tenantId, query);
      const byThread = new Map<string, typeof messages>();
      for (const message of messages) {
        const gmailThreadId = message.gmailThreadId ?? message.id;
        const list = byThread.get(gmailThreadId) ?? [];
        list.push(message);
        byThread.set(gmailThreadId, list);
      }

      for (const [gmailThreadId, threadMessages] of byThread) {
        if (seenThreadIds.has(gmailThreadId)) continue;
        const ownedByOther = [...threadOwners.entries()].some(
          ([tid, owner]) => tid === gmailThreadId && owner.customerId !== customer.id
        );
        if (ownedByOther) continue;

        const hasOurSend = threadMessages.some((message) => agentIdsForCustomer.has(message.id));
        const looksLikeReply = threadMessages.some((message) => {
          if (agentIdsForCustomer.has(message.id)) return false;
          const sentMs = Date.parse(message.sentAt);
          return Number.isFinite(sentMs) && sentMs >= lastAgentMs - 60_000;
        });
        if (!hasOurSend && !looksLikeReply) continue;

        seenThreadIds.add(gmailThreadId);
        for (const message of threadMessages) {
          incoming.push({
            id: message.id,
            threadId,
            customerId: customer.id,
            gmailThreadId: message.gmailThreadId ?? gmailThreadId,
            author: authorForCustomerThread({
              messageId: message.id,
              fromEmails: message.fromEmails,
              mappedAuthor: message.author,
              customerEmail: customer.email,
              knownAgentIds
            }),
            from: message.from,
            to: message.to.length > 0 ? message.to : [connectedEmail],
            subject: message.subject,
            body: message.body,
            sentAt: message.sentAt
          });
        }
      }
    }
  }

  if (incoming.length === 0) return false;
  if (!emailsNeedWrite(existing, incoming)) return false;

  snapshot.sentEmails = mergeThreadEmails(existing, incoming);
  snapshot.inboxMessages = overlayInboxWithSentEmails(snapshot.inboxMessages, snapshot.sentEmails);
  await store.write(tenantId, snapshot);
  return true;
}

export async function syncGmailThreads(tenantId: string): Promise<boolean> {
  const existing = syncInFlight.get(tenantId);
  if (existing) return existing;

  const promise = syncGmailThreadsOnce(tenantId).finally(() => {
    syncInFlight.delete(tenantId);
  });
  syncInFlight.set(tenantId, promise);
  return promise;
}

export function scheduleBackgroundGmailSync(tenantId: string): Promise<boolean> {
  const last = lastSyncAt.get(tenantId) ?? 0;
  if (Date.now() - last < GMAIL_SYNC_TTL_MS) return Promise.resolve(false);

  const existing = inFlight.get(tenantId);
  if (existing) return existing;

  const promise = (async () => {
    const didSync = await syncGmailThreads(tenantId);
    lastSyncAt.set(tenantId, Date.now());
    return didSync;
  })()
    .catch((error) => {
      if (error instanceof GmailNotConnectedError) return false;
      console.error('[gmail] background sync failed:', error);
      return false;
    })
    .finally(() => {
      inFlight.delete(tenantId);
    });

  inFlight.set(tenantId, promise);
  return promise;
}
