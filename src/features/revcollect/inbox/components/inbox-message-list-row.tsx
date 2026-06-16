'use client';

import { memo, useCallback, type MouseEvent, type MouseEventHandler } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { MotionPressable } from '@/features/revcollect/motion/motion-primitives';
import { formatCurrency } from '../../utils';
import type { Customer, InboxMessage } from '../../types';
import { getInboxThreadListBadges, InboxListPill } from '../lib/inbox-list-badges';
import { saveInboxListScrollTop } from '../hooks/use-inbox-list-scroll-preserve';
import { prefetchInboxSelection } from '../lib/prefetch-inbox-selection';

interface InboxMessageListRowProps {
  message: InboxMessage;
  customer: Customer;
  selected: boolean;
  onSelectMessage: (messageId: string) => void;
}

function InboxMessageListRowComponent({
  message,
  customer,
  selected,
  onSelectMessage
}: InboxMessageListRowProps) {
  const queryClient = useQueryClient();
  const showUnread = message.unread;
  const { primary, secondary, status } = getInboxThreadListBadges(message, customer);
  const amountIsOverdue = customer.daysOverdue > 0;
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
        'relative flex w-full gap-2 px-4 py-3.5 text-left transition-colors duration-150',
        selected ? 'text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/60',
        isDeemphasized && !selected && 'opacity-80'
      )}
    >
      {selected ? (
        <motion.span
          layoutId='inbox-list-selection'
          layoutScroll
          className='bg-sidebar-accent absolute inset-0'
          transition={{ type: 'spring', stiffness: 480, damping: 38 }}
        />
      ) : null}
      <div className='relative z-[1] flex w-3 shrink-0 items-start justify-center pt-1.5'>
        {showUnread ? (
          <span className='bg-primary size-1.5 shrink-0 rounded-full' aria-hidden />
        ) : (
          <span className='size-1.5 shrink-0' aria-hidden />
        )}
      </div>

      <div className='relative z-[1] min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-2'>
          <p
            className={cn('min-w-0 truncate text-sm', showUnread ? 'font-semibold' : 'font-medium')}
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

        {primary || secondary ? (
          <div className='relative z-[1] mt-2 flex flex-wrap items-center gap-1'>
            {primary ? (
              <InboxListPill label={primary.label} variant={primary.variant} icon={primary.icon} />
            ) : null}
            {secondary ? (
              <InboxListPill label={secondary.label} variant={secondary.variant} />
            ) : null}
          </div>
        ) : null}
      </div>
    </MotionPressable>
  );
}

function areInboxMessageListRowPropsEqual(
  prev: InboxMessageListRowProps,
  next: InboxMessageListRowProps
): boolean {
  return (
    prev.selected === next.selected &&
    prev.message === next.message &&
    prev.customer === next.customer &&
    prev.onSelectMessage === next.onSelectMessage
  );
}

export const InboxMessageListRow = memo(
  InboxMessageListRowComponent,
  areInboxMessageListRowPropsEqual
);
