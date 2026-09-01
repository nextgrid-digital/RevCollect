'use client';

import type { ComponentType } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Customer, InboxMessage } from '../../types';
import { formatPromisedDateLabel } from '../../lib/collection-decision';
import { relationshipBadgeLabel } from '../../lib/relationship-policy';
import {
  getInboxThreadActionStatus,
  getIntentLabel,
  type InboxThreadActionStatus
} from './get-inbox-thread-action-status';

export type InboxListPillVariant = 'ai_draft' | 'attention' | 'monitoring' | 'muted' | 'overdue';

export interface InboxListPillItem {
  label: string;
  variant: InboxListPillVariant;
  icon?: ComponentType<{ className?: string }>;
}

export interface InboxThreadListBadges {
  primary: InboxListPillItem | null;
  secondary: InboxListPillItem | null;
  status: InboxThreadActionStatus;
}

const pillVariantClasses: Record<InboxListPillVariant, string> = {
  ai_draft:
    'bg-violet-100 text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-950/70 dark:text-violet-200 dark:ring-violet-700/50',
  attention: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  monitoring: 'bg-muted text-muted-foreground ring-1 ring-border',
  muted: 'bg-muted/60 text-muted-foreground',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
};

export function getInboxThreadListBadges(
  message: InboxMessage,
  customer: Customer
): InboxThreadListBadges {
  const status = getInboxThreadActionStatus(message, customer);
  const relationship = relationshipBadgeLabel(customer);
  const primary = relationship
    ? {
        label: relationship,
        variant: (relationship.startsWith('Suggest') || relationship === 'Resume review'
          ? 'attention'
          : relationship.startsWith('Blocked') || relationship === 'Do not contact'
            ? 'overdue'
            : 'monitoring') as InboxListPillVariant
      }
    : getInboxThreadStatusDisplay(status, message, customer);
  const secondary = relationship
    ? getInboxThreadStatusDisplay(status, message, customer)
    : getSecondaryOverdueChip(status, customer.daysOverdue);

  return { primary, secondary, status };
}

function getInboxThreadStatusDisplay(
  status: InboxThreadActionStatus,
  message: InboxMessage,
  customer: Customer
): InboxListPillItem | null {
  switch (status) {
    case 'ai_draft_ready':
      return {
        label: 'AI draft ready',
        variant: 'ai_draft',
        icon: Icons.sparkles
      };
    case 'awaiting_reply':
      return {
        label: 'Awaiting reply',
        variant: 'attention',
        icon: Icons.inbox
      };
    case 'promise_missed':
      return {
        label: customer.promisedDate
          ? `Promise missed · ${formatPromisedDateLabel(customer.promisedDate)}`
          : 'Promise missed',
        variant: 'attention'
      };
    case 'monitoring': {
      if (customer.status === 'promised') {
        return {
          label: customer.promisedDate
            ? `Promised · ${formatPromisedDateLabel(customer.promisedDate)}`
            : 'Promised',
          variant: 'monitoring'
        };
      }
      if (customer.status === 'in_dispute') {
        return {
          label: 'In dispute',
          variant: 'monitoring'
        };
      }
      const intentLabel = getIntentLabel(message.replyIntent, message.replyIntentLabel);
      return {
        label: intentLabel ? `Monitoring · ${intentLabel}` : 'Monitoring',
        variant: 'monitoring'
      };
    }
    case 'up_to_date':
      return {
        label: 'Up to date',
        variant: 'muted'
      };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function getSecondaryOverdueChip(
  status: InboxThreadActionStatus,
  daysOverdue: number
): InboxListPillItem | null {
  if (daysOverdue <= 0) return null;
  if (status !== 'ai_draft_ready' && status !== 'awaiting_reply' && status !== 'promise_missed') {
    return null;
  }

  return {
    label: `${daysOverdue}d overdue`,
    variant: 'overdue'
  };
}

interface InboxListPillProps {
  label: string;
  variant: InboxListPillVariant;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}

export function InboxListPill({ label, variant, icon: Icon, className }: InboxListPillProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
        pillVariantClasses[variant],
        className
      )}
    >
      {Icon ? <Icon className='size-3 shrink-0 opacity-90' aria-hidden /> : null}
      {label}
    </span>
  );
}
