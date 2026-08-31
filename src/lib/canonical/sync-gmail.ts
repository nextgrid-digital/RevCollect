import type { Customer, ThreadEmail } from '@/features/revcollect/types';
import {
  fetchGmailMessageThreadId,
  fetchGmailThreadMessages,
  GmailNotConnectedError,
  getConnectedGmailEmail,
  searchGmailFromAddress
} from '@/lib/integrations/gmail-api';
import { getGmailConnection } from '@/lib/integrations/gmail-connection-store';
import { overlayInboxWithSentEmails } from './sent-emails';
import { getCanonicalStore } from './store';

const GMAIL_SYNC_TTL_MS = 45_000;
const PLACEHOLDER_EMAIL = 'no-email@xero.local';
const lastSyncAt = new Map<string, number>();
const inFlight = new Map<string, Promise<boolean>>();

function isUsableCustomerEmail(email: string, connectedEmail: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@') || normalized === PLACEHOLDER_EMAIL) {
    return false;
  }
  return normalized !== connectedEmail.trim().toLowerCase();
}

function mergeThreadEmails(existing: ThreadEmail[], incoming: ThreadEmail[]): ThreadEmail[] {
  const byId = new Map(existing.map((email) => [email.id, email]));
  for (const email of incoming) {
    const previous = byId.get(email.id);
    byId.set(email.id, previous ? { ...previous, ...email } : email);
  }
  return [...byId.values()];
}

export async function syncGmailThreads(tenantId: string): Promise<boolean> {
  const connection = await getGmailConnection(tenantId);
  if (!connection) return false;

  const connectedEmail = await getConnectedGmailEmail(tenantId);
  if (!connectedEmail) return false;

  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const existing = snapshot.sentEmails ?? [];
  const incoming: ThreadEmail[] = [];

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
    for (const message of messages) {
      incoming.push({
        id: message.id,
        threadId: owner.threadId,
        customerId: owner.customerId,
        gmailThreadId: message.gmailThreadId ?? gmailThreadId,
        author: message.author,
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

  if (incoming.length === 0) return false;

  const existingIds = new Set(existing.map((email) => email.id));
  const hasNew = incoming.some((email) => !existingIds.has(email.id));
  if (!hasNew) return false;

  snapshot.sentEmails = mergeThreadEmails(existing, incoming);
  snapshot.inboxMessages = overlayInboxWithSentEmails(snapshot.inboxMessages, snapshot.sentEmails);
  await store.write(tenantId, snapshot);
  return true;
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
