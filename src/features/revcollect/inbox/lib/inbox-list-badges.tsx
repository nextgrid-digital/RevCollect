'use client';

import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { ReplyIntent } from '../../types';

export type InboxListPillVariant =
  | 'overdue'
  | 'overdue-mild'
  | 'intent'
  | 'promise'
  | 'promise-date'
  | 'draft';

export interface InboxListPillItem {
  label: string;
  variant: InboxListPillVariant;
}

const pillVariantClasses: Record<InboxListPillVariant, string> = {
  overdue: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  'overdue-mild': 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  intent: 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
  promise: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  'promise-date': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  draft: 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300'
};

export function getOverdueBadgeClass(daysOverdue: number): InboxListPillVariant {
  if (daysOverdue >= 30) {
    return 'overdue';
  }
  return 'overdue-mild';
}

function capitalizeIntent(intent: ReplyIntent): string {
  return intent.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getInboxIntentPills(
  replyIntent: ReplyIntent | undefined,
  replyIntentLabel: string | undefined
): InboxListPillItem[] {
  if (!replyIntent) {
    return replyIntentLabel ? [{ label: replyIntentLabel, variant: 'intent' }] : [];
  }

  switch (replyIntent) {
    case 'deflection':
      return [{ label: replyIntentLabel ?? 'Deflection', variant: 'intent' }];
    case 'promise': {
      const label = replyIntentLabel ?? 'Promise';
      const byMatch = label.match(/^Promise\s+(.+)$/i);
      if (byMatch) {
        return [
          { label: 'Promise', variant: 'promise' },
          { label: byMatch[1], variant: 'promise-date' }
        ];
      }
      return [{ label, variant: 'promise' }];
    }
    case 'dispute':
      return [{ label: replyIntentLabel ?? 'Dispute', variant: 'intent' }];
    case 'payment_confirmation':
      return [{ label: replyIntentLabel ?? 'Payment confirmation', variant: 'promise' }];
    case 'other':
      return replyIntentLabel
        ? [{ label: replyIntentLabel, variant: 'intent' }]
        : [{ label: capitalizeIntent(replyIntent), variant: 'intent' }];
    default: {
      const _exhaustive: never = replyIntent;
      return _exhaustive;
    }
  }
}

export function getInboxListPills(
  daysOverdue: number,
  replyIntent: ReplyIntent | undefined,
  replyIntentLabel: string | undefined,
  agentDraftReady: boolean | undefined,
  options?: { excludeDraftPill?: boolean }
): InboxListPillItem[] {
  const pills: InboxListPillItem[] = [];

  if (daysOverdue > 0) {
    pills.push({
      label: `${daysOverdue}d overdue`,
      variant: getOverdueBadgeClass(daysOverdue)
    });
  }

  pills.push(...getInboxIntentPills(replyIntent, replyIntentLabel));

  if (agentDraftReady && !options?.excludeDraftPill) {
    pills.push({ label: 'Draft', variant: 'draft' });
  }

  return pills;
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
