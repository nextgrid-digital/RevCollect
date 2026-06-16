'use client';

import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { ReplyIntent } from '../../types';

export type InboxListPillVariant = 'danger' | 'neutral' | 'draft';

export interface InboxListPillItem {
  label: string;
  variant: InboxListPillVariant;
}

const pillVariantClasses: Record<InboxListPillVariant, string> = {
  danger: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  neutral: 'bg-muted text-muted-foreground',
  draft: 'bg-muted text-muted-foreground ring-1 ring-border'
};

function capitalizeIntent(intent: ReplyIntent): string {
  return intent.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getIntentLabel(
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

/** Returns at most one list pill: draft > overdue > intent. */
export function getPrimaryListPill(
  daysOverdue: number,
  replyIntent: ReplyIntent | undefined,
  replyIntentLabel: string | undefined,
  agentDraftReady: boolean | undefined
): InboxListPillItem | null {
  if (agentDraftReady) {
    return { label: 'Draft', variant: 'draft' };
  }

  if (daysOverdue > 0) {
    return { label: `${daysOverdue}d overdue`, variant: 'danger' };
  }

  const intentLabel = getIntentLabel(replyIntent, replyIntentLabel);
  if (intentLabel) {
    return { label: intentLabel, variant: 'neutral' };
  }

  return null;
}

interface InboxListPillProps {
  label: string;
  variant: InboxListPillVariant;
  className?: string;
}

export function InboxListPill({ label, variant, className }: InboxListPillProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
        pillVariantClasses[variant],
        className
      )}
    >
      {variant === 'draft' ? (
        <Icons.squareCheck className='size-3 shrink-0 opacity-90' aria-hidden />
      ) : null}
      {label}
    </span>
  );
}
