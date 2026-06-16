import type { Customer, InboxMessage } from '../types';

export function getSuggestedActionForCustomer(
  customerId: string,
  inboxMessages: InboxMessage[]
): string | undefined {
  return inboxMessages.find((message) => message.customerId === customerId)?.suggestedAction;
}

export function getInboxMessageIdForCustomer(
  customerId: string,
  inboxMessages: InboxMessage[]
): string | undefined {
  return inboxMessages.find((message) => message.customerId === customerId)?.id;
}

export function getSuggestedActionLabel(customer: Customer): string {
  switch (customer.status) {
    case 'overdue':
      return 'Send collection follow-up';
    case 'due_soon':
      return 'Send payment reminder';
    case 'in_dispute':
      return 'Review dispute thread';
    case 'promised':
      return 'Confirm payment promise';
    case 'current':
      return 'View customer';
    default: {
      const _exhaustive: never = customer.status;
      return _exhaustive;
    }
  }
}
