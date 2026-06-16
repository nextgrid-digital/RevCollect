import type { Customer, InboxMessage, ReplyIntent } from '../../types';

export type InboxThreadActionStatus =
  | 'ai_draft_ready'
  | 'awaiting_reply'
  | 'monitoring'
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
  _customer: Customer
): InboxThreadActionStatus {
  if (message.agentDraftReady) {
    return 'ai_draft_ready';
  }

  if (message.unread) {
    return 'awaiting_reply';
  }

  if (message.replyIntent ?? message.replyIntentLabel) {
    return 'monitoring';
  }

  return 'up_to_date';
}

export function threadNeedsAttention(status: InboxThreadActionStatus): boolean {
  return status === 'ai_draft_ready' || status === 'awaiting_reply';
}
