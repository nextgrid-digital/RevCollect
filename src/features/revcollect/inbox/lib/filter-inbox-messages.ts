import type { Customer, InboxMessage } from '../../types';

export type InboxListFilter = 'all' | 'overdue' | 'due_soon' | 'escalated';

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
    const customer = getCustomer(message.customerId);
    if (!customer) return false;

    const matchesFilter =
      filter === 'all' ||
      (filter === 'overdue' && customer.status === 'overdue') ||
      (filter === 'due_soon' && customer.status === 'due_soon') ||
      (filter === 'escalated' && customer.status === 'in_dispute');
    if (!matchesFilter) return false;

    return matchesSearch(message, customer, normalizedQuery);
  });
}
