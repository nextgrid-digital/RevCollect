'use client';

import { cn } from '@/lib/utils';
import { formatInboxListTimestamp } from '../../utils';
import type { Customer, InboxMessage } from '../../types';
import { getPrimaryListPill, InboxListPill } from '../lib/inbox-list-badges';

interface InboxNotionListRowProps {
  message: InboxMessage;
  customer: Customer;
  selected: boolean;
  onSelect: () => void;
}

export function InboxNotionListRow({
  message,
  customer,
  selected,
  onSelect
}: InboxNotionListRowProps) {
  const showUnread = message.unread;
  const pill = getPrimaryListPill(
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
          'flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left transition-colors',
          'hover:bg-muted/40 border-l-transparent',
          selected && 'border-l-sidebar-primary bg-muted/60'
        )}
      >
        <div className='flex w-3 shrink-0 items-center justify-center'>
          {showUnread ? (
            <span className='bg-primary size-1.5 shrink-0 rounded-full' aria-hidden />
          ) : (
            <span className='size-1.5 shrink-0' aria-hidden />
          )}
        </div>

        <div className='flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden'>
          <span className={cn('shrink-0 text-sm', showUnread ? 'font-semibold' : 'font-medium')}>
            {customer.company}
          </span>
          <span className='text-muted-foreground min-w-0 truncate text-sm'>{message.preview}</span>
        </div>

        {pill ? (
          <div className='flex shrink-0 items-center gap-1'>
            <InboxListPill label={pill.label} variant={pill.variant} />
          </div>
        ) : null}

        <time
          className='text-muted-foreground shrink-0 text-xs tabular-nums'
          dateTime={message.receivedAt}
        >
          {formatInboxListTimestamp(message.receivedAt)}
        </time>
      </button>
    </li>
  );
}
