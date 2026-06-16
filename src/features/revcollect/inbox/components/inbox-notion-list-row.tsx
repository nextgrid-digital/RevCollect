'use client';

import { memo, useCallback, type MouseEvent, type MouseEventHandler } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { MotionPressable } from '@/features/revcollect/motion/motion-primitives';
import { formatInboxListTimestamp } from '../../utils';
import type { Customer, InboxMessage } from '../../types';
import { getInboxThreadListBadges, InboxListPill } from '../lib/inbox-list-badges';
import { saveInboxListScrollTop } from '../hooks/use-inbox-list-scroll-preserve';
import { prefetchInboxSelection } from '../lib/prefetch-inbox-selection';

interface InboxNotionListRowProps {
  message: InboxMessage;
  customer: Customer;
  selected: boolean;
  onSelectMessage: (messageId: string) => void;
}

function InboxNotionListRowComponent({
  message,
  customer,
  selected,
  onSelectMessage
}: InboxNotionListRowProps) {
  const queryClient = useQueryClient();
  const showUnread = message.unread;
  const { primary, secondary, status } = getInboxThreadListBadges(message, customer);
  const isDeemphasized = status === 'up_to_date';

  const handlePrefetch = useCallback(() => {
    prefetchInboxSelection(queryClient, message.id);
  }, [message.id, queryClient]);

  const handleMouseDown: MouseEventHandler<HTMLButtonElement> = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleSelect = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const scrollContainer = event.currentTarget.closest('[data-inbox-list-scroll]');
      if (scrollContainer instanceof HTMLElement) {
        saveInboxListScrollTop(scrollContainer.scrollTop);
      }
      event.currentTarget.focus({ preventScroll: true });
      onSelectMessage(message.id);
    },
    [message.id, onSelectMessage]
  );

  return (
    <MotionPressable
      data-inbox-message-id={message.id}
      onMouseDown={handleMouseDown}
      onClick={handleSelect}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      className={cn(
        'relative flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left transition-colors duration-150',
        'border-l-transparent hover:bg-muted/40',
        isDeemphasized && !selected && 'opacity-80'
      )}
    >
      {selected ? (
        <motion.span
          layoutId='inbox-notion-list-selection'
          layoutScroll
          className='border-l-sidebar-primary bg-muted/60 absolute inset-0 border-l-2'
          transition={{ type: 'spring', stiffness: 480, damping: 38 }}
        />
      ) : null}
      <div className='relative z-[1] flex w-3 shrink-0 items-center justify-center'>
        {showUnread ? (
          <span className='bg-primary size-1.5 shrink-0 rounded-full' aria-hidden />
        ) : (
          <span className='size-1.5 shrink-0' aria-hidden />
        )}
      </div>

      <div className='relative z-[1] flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden'>
        <span className={cn('shrink-0 text-sm', showUnread ? 'font-semibold' : 'font-medium')}>
          {customer.company}
        </span>
        <span className='text-muted-foreground min-w-0 truncate text-sm'>{message.preview}</span>
      </div>

      {primary || secondary ? (
        <div className='relative z-[1] flex shrink-0 flex-wrap items-center justify-end gap-1'>
          {primary ? (
            <InboxListPill label={primary.label} variant={primary.variant} icon={primary.icon} />
          ) : null}
          {secondary ? <InboxListPill label={secondary.label} variant={secondary.variant} /> : null}
        </div>
      ) : null}

      <time
        className='text-muted-foreground relative z-[1] shrink-0 text-xs tabular-nums'
        dateTime={message.receivedAt}
      >
        {formatInboxListTimestamp(message.receivedAt)}
      </time>
    </MotionPressable>
  );
}

function areInboxNotionListRowPropsEqual(
  prev: InboxNotionListRowProps,
  next: InboxNotionListRowProps
): boolean {
  return (
    prev.selected === next.selected &&
    prev.message === next.message &&
    prev.customer === next.customer &&
    prev.onSelectMessage === next.onSelectMessage
  );
}

export const InboxNotionListRow = memo(
  InboxNotionListRowComponent,
  areInboxNotionListRowPropsEqual
);
