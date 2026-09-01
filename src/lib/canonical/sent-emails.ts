import type {
  Customer,
  InboxMessage,
  ThreadEmail,
  TimelineEvent
} from '@/features/revcollect/types';
import { getCanonicalStore } from './store';
import type { CanonicalSnapshot } from './types';

function previewFromBody(body: string): string {
  const line = body.split('\n').find((part) => part.trim() && part.trim() !== '---') ?? body;
  return line.trim().slice(0, 140);
}

function stripReplyPrefix(subject: string): string {
  return subject.replace(/^((re|fwd|fw)\s*:\s*)+/i, '').trim();
}

function customerIdForMailSubject(
  subject: string,
  customers: Customer[],
  fallbackCustomerId: string
): string {
  const hay = stripReplyPrefix(subject).toLowerCase();
  if (!hay) return fallbackCustomerId;
  const matches = customers.filter((customer) => {
    const company = customer.company.trim().toLowerCase();
    const name = customer.name.trim().toLowerCase();
    return (
      (company.length >= 3 && hay.includes(company)) ||
      (name.length >= 3 && name !== company && hay.includes(name))
    );
  });
  if (matches.length === 1) return matches[0].id;
  if (matches.some((customer) => customer.id === fallbackCustomerId)) {
    return fallbackCustomerId;
  }
  return fallbackCustomerId;
}

export function rehomeSentEmails(sentEmails: ThreadEmail[], customers: Customer[]): ThreadEmail[] {
  if (sentEmails.length === 0 || customers.length === 0) return sentEmails;

  const openIdsByEmail = new Map<string, string[]>();
  for (const customer of customers) {
    const mailbox = customer.email.trim().toLowerCase();
    if (!mailbox || customer.balanceCents <= 0) continue;
    const list = openIdsByEmail.get(mailbox) ?? [];
    list.push(customer.id);
    openIdsByEmail.set(mailbox, list);
  }

  const customerById = new Map(customers.map((customer) => [customer.id, customer]));

  return sentEmails.map((email) => {
    const current = email.customerId ? customerById.get(email.customerId) : undefined;
    const mailbox = current?.email.trim().toLowerCase() ?? '';
    const sameMailbox = mailbox
      ? customers.filter((customer) => customer.email.trim().toLowerCase() === mailbox)
      : customers;
    const openForMailbox = mailbox ? (openIdsByEmail.get(mailbox) ?? []) : [];

    let customerId = email.customerId ?? '';
    if (openForMailbox.length === 1) {
      customerId = openForMailbox[0];
    } else {
      customerId = customerIdForMailSubject(email.subject, sameMailbox, customerId);
    }

    if (!customerId) return email;
    const threadId = `xero-customer-${customerId}`;
    if (customerId === email.customerId && email.threadId === threadId) return email;
    return { ...email, customerId, threadId };
  });
}

export function sentEmailsForThread(
  sentEmails: ThreadEmail[],
  threadId: string,
  customerId: string
): ThreadEmail[] {
  return sentEmails
    .filter(
      (email) =>
        email.threadId === threadId ||
        email.customerId === customerId ||
        email.threadId === `xero-customer-${customerId}`
    )
    .toSorted((left, right) => left.sentAt.localeCompare(right.sentAt));
}

export function overlayInboxWithSentEmails(
  messages: InboxMessage[],
  sentEmails: ThreadEmail[]
): InboxMessage[] {
  if (sentEmails.length === 0) return messages;

  const latestByCustomer = new Map<string, ThreadEmail>();
  for (const email of sentEmails) {
    const customerId =
      email.customerId ??
      (email.threadId.startsWith('xero-customer-')
        ? email.threadId.slice('xero-customer-'.length)
        : undefined);
    if (!customerId) continue;
    const current = latestByCustomer.get(customerId);
    if (!current || email.sentAt > current.sentAt) {
      latestByCustomer.set(customerId, email);
    }
  }

  return messages.map((message) => {
    const last = latestByCustomer.get(message.customerId);
    if (!last) return message;
    return {
      ...message,
      preview: previewFromBody(last.body),
      receivedAt: last.sentAt,
      unread: last.author === 'customer'
    };
  });
}

export async function persistRehomedSentEmails(tenantId: string): Promise<boolean> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const existing = snapshot.sentEmails ?? [];
  const next = rehomeSentEmails(existing, snapshot.customers as Customer[]);
  const changed =
    next.length !== existing.length ||
    next.some((email, index) => {
      const previous = existing[index];
      return (
        !previous ||
        previous.id !== email.id ||
        previous.customerId !== email.customerId ||
        previous.threadId !== email.threadId
      );
    });
  if (!changed) return false;

  snapshot.sentEmails = next;
  snapshot.inboxMessages = overlayInboxWithSentEmails(snapshot.inboxMessages, next);
  await store.write(tenantId, snapshot);
  return true;
}

export function timelineEventsFromSentEmails(
  sentEmails: ThreadEmail[],
  customerId: string
): TimelineEvent[] {
  return sentEmailsForThread(sentEmails, `xero-customer-${customerId}`, customerId).map(
    (email) => ({
      id: `mail-${email.id}`,
      customerId,
      type: email.author === 'customer' ? ('email_received' as const) : ('email_sent' as const),
      title: email.author === 'customer' ? 'Customer replied' : 'Follow-up sent',
      description: previewFromBody(email.body),
      occurredAt: email.sentAt,
      threadEmailId: email.id
    })
  );
}

export async function persistSentFollowUp(input: {
  tenantId: string;
  customerId: string;
  email: ThreadEmail;
}): Promise<CanonicalSnapshot> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(input.tenantId);
  const sentEmails = rehomeSentEmails(
    [...(snapshot.sentEmails ?? []), input.email],
    snapshot.customers as Customer[]
  );
  snapshot.sentEmails = sentEmails;
  snapshot.drafts = snapshot.drafts.filter((draft) => draft.customerId !== input.customerId);
  snapshot.inboxMessages = overlayInboxWithSentEmails(snapshot.inboxMessages, sentEmails).map(
    (message) =>
      message.customerId === input.customerId ? { ...message, agentDraftReady: false } : message
  );
  await store.write(input.tenantId, snapshot);
  return snapshot;
}
