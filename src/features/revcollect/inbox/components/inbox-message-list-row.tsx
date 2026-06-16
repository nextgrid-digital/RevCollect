'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '../../utils';
import type { Customer, InboxMessage } from '../../types';
import { getPrimaryListPill, InboxListPill } from '../lib/inbox-list-badges';

interface InboxMessageListRowProps {
  message: InboxMessage;
  customer: Customer;
  selected: boolean;
  onSelect: () => void;
}

export function InboxMessageListRow({
  message,
  customer,
  selected,
  onSelect
}: InboxMessageListRowProps) {
  const showUnread = message.unread;
  const pill = getPrimaryListPill(
    customer.daysOverdue,
    message.replyIntent,
    message.replyIntentLabel,
    message.agentDraftReady
  );
  const amountIsOverdue = customer.daysOverdue > 0;

  return (
    <li>
      <button
        type='button'
        onClick={onSelect}
        className={cn(
          'flex w-full border-l-2 px-4 py-3 text-left transition-colors',
          selected
            ? 'border-l-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent'
            : 'hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground border-l-transparent'
        )}
      >
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <p
              className={cn(
                'min-w-0 truncate text-sm',
                showUnread ? 'font-semibold' : 'font-medium'
              )}
            >
              {customer.company}
            </p>
            <span
              className={cn(
                'shrink-0 text-sm tabular-nums',
                amountIsOverdue
                  ? 'font-semibold text-red-700 dark:text-red-400'
                  : 'font-medium text-foreground'
              )}
            >
              {formatCurrency(customer.balanceCents)}
            </span>
          </div>

          <p className='text-sidebar-foreground/70 mt-0.5 truncate text-sm leading-relaxed'>
            {message.preview}
          </p>

          {pill ? (
            <div className='mt-1.5 flex flex-wrap items-center gap-1'>
              <InboxListPill label={pill.label} variant={pill.variant} />
            </div>
          ) : null}
        </div>
      </button>
    </li>
  );
}
