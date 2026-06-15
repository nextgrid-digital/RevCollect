'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Customer, InboxMessage } from '../../types';
import { groupInboxMessagesByDate } from '../lib/group-inbox-messages-by-date';
import { InboxMessageListHeader } from './inbox-message-list-header';
import { InboxMessageListRow } from './inbox-message-list-row';
import type { InboxListFilter } from '../lib/filter-inbox-messages';

interface InboxMessageListProps {
  className?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  listFilter: InboxListFilter;
  onFilterChange: (filter: InboxListFilter) => void;
  allCount: number;
  overdueCount: number;
  dueSoonCount: number;
  escalatedCount: number;
  filteredMessages: InboxMessage[];
  selectedId: string | null;
  onSelectMessage: (messageId: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  emptyMessage: string;
}

export function InboxMessageList({
  className,
  searchQuery,
  onSearchChange,
  listFilter,
  onFilterChange,
  allCount,
  overdueCount,
  dueSoonCount,
  escalatedCount,
  filteredMessages,
  selectedId,
  onSelectMessage,
  getCustomerById,
  emptyMessage
}: InboxMessageListProps) {
  const groups = groupInboxMessagesByDate(filteredMessages);
  const leadDraftMessageIds = useMemo(
    () => new Set(filteredMessages.slice(0, 2).map((message) => message.id)),
    [filteredMessages]
  );

  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}>
      <InboxMessageListHeader
        search={searchQuery}
        onSearchChange={onSearchChange}
        filter={listFilter}
        onFilterChange={onFilterChange}
        allCount={allCount}
        overdueCount={overdueCount}
        dueSoonCount={dueSoonCount}
        escalatedCount={escalatedCount}
      />

      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        {filteredMessages.length === 0 ? (
          <p className='text-muted-foreground px-4 py-12 text-center text-sm'>{emptyMessage}</p>
        ) : (
          <div className='pb-4'>
            {groups.map((group, groupIndex) => {
              const followsToday = groupIndex > 0 && groups[groupIndex - 1]?.label === null;
              const isFirstGroup = groupIndex === 0;

              return (
                <section key={group.id}>
                  {group.label ? (
                    <div
                      className={cn(
                        'border-border/60 sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm',
                        isFirstGroup ? 'pt-2' : followsToday ? 'pt-10' : 'pt-12'
                      )}
                    >
                      <h2 className='text-muted-foreground px-4 pb-3.5 text-xs font-medium'>
                        {group.label}
                      </h2>
                    </div>
                  ) : null}
                  <ul>
                    {group.messages.map((message) => {
                      const msgCustomer = getCustomerById(message.customerId);
                      if (!msgCustomer) return null;

                      return (
                        <InboxMessageListRow
                          key={message.id}
                          message={message}
                          customer={msgCustomer}
                          selected={selectedId === message.id}
                          showAgentDraftedLeadPill={leadDraftMessageIds.has(message.id)}
                          onSelect={() => onSelectMessage(message.id)}
                        />
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
