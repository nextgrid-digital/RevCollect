import type { Customer, InboxMessage } from '../../types';
import { getInboxThreadActionStatus, threadNeedsAttention } from './get-inbox-thread-action-status';

export type InboxListFilter =
  | 'all'
  | 'needs_attention'
  | 'overdue'
  | 'drafts'
  | 'up_to_date'
  | 'escalated';

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

    const actionStatus = getInboxThreadActionStatus(message, customer);

    const matchesFilter =
      filter === 'all' ||
      (filter === 'needs_attention' && threadNeedsAttention(actionStatus)) ||
      (filter === 'overdue' && customer.status === 'overdue') ||
      (filter === 'drafts' && message.agentDraftReady) ||
      (filter === 'up_to_date' && actionStatus === 'up_to_date') ||
      (filter === 'escalated' && customer.status === 'in_dispute');
    if (!matchesFilter) return false;

    return matchesSearch(message, customer, normalizedQuery);
  });
}
