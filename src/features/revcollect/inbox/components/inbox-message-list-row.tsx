'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '../../utils';
import type { Customer, InboxMessage } from '../../types';
import { getInboxListPills, InboxListPill } from '../lib/inbox-list-badges';

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
  const pills = getInboxListPills(
    customer.daysOverdue,
    message.replyIntent,
    message.replyIntentLabel,
    message.agentDraftReady
  );

  return (
    <li>
      <button
        type='button'
        onClick={onSelect}
        className={cn(
          'flex w-full border-l-2 px-4 py-3 text-left transition-colors',
          selected
            ? 'border-l-violet-500 bg-violet-50/60 hover:bg-violet-50/80 dark:border-l-violet-400 dark:bg-violet-950/25 dark:hover:bg-violet-950/40'
            : 'hover:bg-muted/40 border-l-transparent'
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
            <span className='text-foreground shrink-0 text-sm font-semibold tabular-nums'>
              {formatCurrency(customer.balanceCents)}
            </span>
          </div>

          <p className={cn('mt-0.5 truncate text-sm', showUnread ? 'font-medium' : 'font-normal')}>
            {message.subject}
          </p>

          <p className='text-muted-foreground mt-0.5 truncate text-xs leading-relaxed'>
            {message.preview}
          </p>

          {pills.length > 0 ? (
            <div className='mt-1.5 flex flex-wrap items-center gap-1'>
              {pills.map((pill) => (
                <InboxListPill key={pill.label} label={pill.label} variant={pill.variant} />
              ))}
            </div>
          ) : null}
        </div>
      </button>
    </li>
  );
}
