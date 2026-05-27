import type { Customer, InboxMessage } from '../../types';

export type InboxListFilter = 'unread' | 'read';

function matchesSearch(
  message: InboxMessage,
  customer: Customer | undefined,
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) return true;

  const haystack = [
    message.subject,
    message.preview,
    customer?.company,
    customer?.name,
    customer?.email
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export function filterInboxMessages(
  messages: InboxMessage[],
  filter: InboxListFilter,
  query: string,
  getCustomer: (customerId: string) => Customer | undefined
): InboxMessage[] {
  const normalizedQuery = query.trim().toLowerCase();

  return messages.filter((message) => {
    const matchesFilter = filter === 'unread' ? message.unread : !message.unread;
    if (!matchesFilter) return false;

    const customer = getCustomer(message.customerId);
    return matchesSearch(message, customer, normalizedQuery);
  });
}
