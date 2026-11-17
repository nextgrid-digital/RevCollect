import type { Customer, InboxMessage, ReplyIntent } from '../../types';
import { isBrokenPromise } from '../../lib/collection-decision';
import { policyFromCustomer } from '../../lib/relationship-policy';

export type InboxThreadActionStatus =
  | 'ai_draft_ready'
  | 'awaiting_reply'
  | 'needs_follow_up'
  | 'monitoring'
  | 'promise_missed'
  | 'up_to_date';

function capitalizeIntent(intent: ReplyIntent): string {
  return intent.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getIntentLabel(
  replyIntent: ReplyIntent | undefined,
  replyIntentLabel: string | undefined
): string | null {
  if (!replyIntent) {
    return replyIntentLabel ?? null;
  }

  switch (replyIntent) {
    case 'deflection':
      return replyIntentLabel ?? 'Deflection';
    case 'promise':
      return replyIntentLabel ?? 'Promise';
    case 'dispute':
      return replyIntentLabel ?? 'Dispute';
    case 'payment_confirmation':
      return replyIntentLabel ?? 'Payment confirmation';
    case 'other':
      return replyIntentLabel ?? capitalizeIntent(replyIntent);
    default: {
      const _exhaustive: never = replyIntent;
      return _exhaustive;
    }
  }
}

export function getInboxThreadActionStatus(
  message: InboxMessage,
  customer: Customer
): InboxThreadActionStatus {
  if (
    message.id.startsWith('xero-customer-') &&
    customer.balanceCents > 0 &&
    !(message.unread && message.outboundSent)
  ) {
    return 'needs_follow_up';
  }

  if (customer.status === 'in_dispute') {
    return 'monitoring';
  }

  if (customer.status === 'promised' && !isBrokenPromise(customer)) {
    return 'monitoring';
  }

  if (message.agentDraftReady) {
    return 'ai_draft_ready';
  }

  if (isBrokenPromise(customer)) {
    return 'promise_missed';
  }

  if (message.unread && message.outboundSent) {
    return 'awaiting_reply';
  }

  if (message.replyIntent ?? message.replyIntentLabel) {
    return 'monitoring';
  }

  if (customer.daysOverdue > 0 || customer.balanceCents > 0) {
    return 'needs_follow_up';
  }

  return 'up_to_date';
}

export function threadNeedsAttention(
  status: InboxThreadActionStatus,
  customer?: Customer,
  message?: InboxMessage
): boolean {
  if (!customer || customer.daysOverdue <= 0) return false;
  const policy = policyFromCustomer(customer);
  if (
    policy.state === 'paused_until_date' ||
    policy.state === 'manual_only' ||
    policy.state === 'do_not_contact'
  ) {
    return false;
  }
  if (message?.outboundSent && isSameLocalDay(message.receivedAt)) return false;
  return (
    status === 'ai_draft_ready' ||
    status === 'awaiting_reply' ||
    status === 'promise_missed' ||
    status === 'needs_follow_up'
  );
}

function isSameLocalDay(iso: string, now = new Date()): boolean {
  const day = iso.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso) || /^\d{4}-\d{2}-\d{2}T00:00:00/.test(iso)) {
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return day === today;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
