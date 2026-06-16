'use client';

import { cn } from '@/lib/utils';
import type { Customer, InboxMessage } from '../../types';
import { groupInboxMessagesByDate } from '../lib/group-inbox-messages-by-date';
import { InboxMessageListHeader } from './inbox-message-list-header';
import { InboxMessageListRow } from './inbox-message-list-row';
import { InboxNotionListRow } from './inbox-notion-list-row';
import type { InboxListFilter } from '../lib/filter-inbox-messages';

export type InboxMessageListVariant = 'workspace' | 'notion';

interface InboxMessageListProps {
  variant?: InboxMessageListVariant;
  className?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  listFilter: InboxListFilter;
  onFilterChange: (filter: InboxListFilter) => void;
  allCount: number;
  overdueCount: number;
  draftsCount: number;
  repliedCount: number;
  disputesCount: number;
  filteredMessages: InboxMessage[];
  selectedId: string | null;
  onSelectMessage: (messageId: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  emptyMessage: string;
}

export function InboxMessageList({
  variant = 'workspace',
  className,
  searchQuery,
  onSearchChange,
  listFilter,
  onFilterChange,
  allCount,
  overdueCount,
  draftsCount,
  repliedCount,
  disputesCount,
  filteredMessages,
  selectedId,
  onSelectMessage,
  getCustomerById,
  emptyMessage
}: InboxMessageListProps) {
  const groups = groupInboxMessagesByDate(filteredMessages);

  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}>
      <InboxMessageListHeader
        variant={variant}
        search={searchQuery}
        onSearchChange={onSearchChange}
        filter={listFilter}
        onFilterChange={onFilterChange}
        allCount={allCount}
        overdueCount={overdueCount}
        draftsCount={draftsCount}
        repliedCount={repliedCount}
        disputesCount={disputesCount}
      />

      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        {filteredMessages.length === 0 ? (
          <p
            className={cn(
              'px-4 py-12 text-center text-sm',
              variant === 'workspace' ? 'text-sidebar-foreground/70' : 'text-muted-foreground'
            )}
          >
            {emptyMessage}
          </p>
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
                        'sticky top-0 z-10 border-b backdrop-blur-sm',
                        variant === 'workspace'
                          ? 'border-sidebar-border bg-sidebar/95'
                          : 'border-border/60 bg-background/95',
                        isFirstGroup ? 'pt-2' : followsToday ? 'pt-10' : 'pt-12'
                      )}
                    >
                      <h2
                        className={cn(
                          'px-4 pb-3.5 text-xs font-medium',
                          variant === 'workspace'
                            ? 'text-sidebar-foreground/70'
                            : 'text-muted-foreground'
                        )}
                      >
                        {group.label}
                      </h2>
                    </div>
                  ) : null}
                  <ul>
                    {group.messages.map((message) => {
                      const msgCustomer = getCustomerById(message.customerId);
                      if (!msgCustomer) return null;

                      const Row = variant === 'notion' ? InboxNotionListRow : InboxMessageListRow;

                      return (
                        <Row
                          key={message.id}
                          message={message}
                          customer={msgCustomer}
                          selected={selectedId === message.id}
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
