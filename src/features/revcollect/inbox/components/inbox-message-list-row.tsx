'use client';

import { cn } from '@/lib/utils';
import type { Customer, InboxMessage } from '../../types';
import { formatInboxListTimestamp } from '../../utils';
import { getInboxListPills, InboxAgentDraftedPill, InboxListPill } from '../lib/inbox-list-badges';

interface InboxMessageListRowProps {
  message: InboxMessage;
  customer: Customer;
  selected: boolean;
  showAgentDraftedLeadPill?: boolean;
  onSelect: () => void;
}

export function InboxMessageListRow({
  message,
  customer,
  selected,
  showAgentDraftedLeadPill = false,
  onSelect
}: InboxMessageListRowProps) {
  const showUnread = message.unread;
  const pills = getInboxListPills(
    customer.daysOverdue,
    message.replyIntent,
    message.replyIntentLabel,
    message.agentDraftReady && !showAgentDraftedLeadPill,
    { excludeDraftPill: showAgentDraftedLeadPill }
  );

  return (
    <li>
      <button
        type='button'
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left transition-colors',
          showAgentDraftedLeadPill
            ? 'border-l-violet-500 bg-violet-50/60 hover:bg-violet-50/80 dark:border-l-violet-400 dark:bg-violet-950/25 dark:hover:bg-violet-950/40'
            : 'hover:bg-muted/40 border-l-transparent',
          selected && !showAgentDraftedLeadPill && 'bg-muted/60',
          selected && showAgentDraftedLeadPill && 'bg-violet-100/70 dark:bg-violet-950/45'
        )}
      >
        <div className='flex w-3 shrink-0 items-center justify-center'>
          {showUnread ? (
            <span className='bg-primary size-1.5 shrink-0 rounded-full' aria-hidden />
          ) : (
            <span className='size-1.5 shrink-0' aria-hidden />
          )}
        </div>

        {showAgentDraftedLeadPill ? <InboxAgentDraftedPill className='shrink-0' /> : null}

        <div className='flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden'>
          <span className={cn('shrink-0 text-sm', showUnread ? 'font-semibold' : 'font-medium')}>
            {customer.company}
          </span>
          <span className='text-muted-foreground min-w-0 truncate text-sm'>
            <span className='text-foreground/80'>{message.subject}</span>
            <span className='mx-1'>—</span>
            {message.preview}
          </span>
        </div>

        {pills.length > 0 ? (
          <div className='flex shrink-0 items-center gap-1'>
            {pills.map((pill) => (
              <InboxListPill key={pill.label} label={pill.label} variant={pill.variant} />
            ))}
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
