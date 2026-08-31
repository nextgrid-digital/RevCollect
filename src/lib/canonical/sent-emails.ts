import type { InboxMessage, ThreadEmail, TimelineEvent } from '@/features/revcollect/types';
import { getCanonicalStore } from './store';
import type { CanonicalSnapshot } from './types';

function previewFromBody(body: string): string {
  const line = body.split('\n').find((part) => part.trim() && part.trim() !== '---') ?? body;
  return line.trim().slice(0, 140);
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
  const sentEmails = [...(snapshot.sentEmails ?? []), input.email];
  snapshot.sentEmails = sentEmails;
  snapshot.drafts = snapshot.drafts.filter((draft) => draft.customerId !== input.customerId);
  snapshot.inboxMessages = overlayInboxWithSentEmails(snapshot.inboxMessages, sentEmails).map(
    (message) =>
      message.customerId === input.customerId ? { ...message, agentDraftReady: false } : message
  );
  await store.write(input.tenantId, snapshot);
  return snapshot;
}
