import {
  getInboxThreadActionStatus,
  type InboxThreadActionStatus
} from '@/features/revcollect/inbox/lib/get-inbox-thread-action-status';
import type { Customer, InboxMessage } from '@/features/revcollect/types';

const RANK: Record<InboxThreadActionStatus, number> = {
  promise_missed: 0,
  ai_draft_ready: 1,
  awaiting_reply: 2,
  needs_follow_up: 3,
  monitoring: 4,
  up_to_date: 5
};

export interface NeedsYouRow {
  message: InboxMessage;
  customer: Customer;
  status: InboxThreadActionStatus;
}

export function needsYouReason(status: InboxThreadActionStatus): string {
  if (status === 'promise_missed') return 'They missed a promise';
  return 'A draft is waiting for you to send';
}

export function listNeedsYou(messages: InboxMessage[], customers: Customer[]): NeedsYouRow[] {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const rows: NeedsYouRow[] = [];

  for (const message of messages) {
    const customer = customersById.get(message.customerId);
    if (!customer) continue;
    const status = getInboxThreadActionStatus(message, customer);
    if (status !== 'promise_missed' && status !== 'ai_draft_ready') continue;
    rows.push({ message, customer, status });
  }

  rows.sort((left, right) => {
    const rank = RANK[left.status] - RANK[right.status];
    if (rank !== 0) return rank;
    return right.customer.balanceCents - left.customer.balanceCents;
  });

  return rows;
}

export function needsYouCountLabel(count: number): string {
  if (count === 0) return 'Nothing is waiting.';
  if (count === 1) return '1 thread needs a person.';
  return `${count} threads need a person.`;
}
