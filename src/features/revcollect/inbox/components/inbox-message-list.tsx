'use client';

import { useRef } from 'react';
import { LayoutGroup } from 'motion/react';
import { cn } from '@/lib/utils';
import type { Customer, InboxMessage } from '../../types';
import { groupInboxMessagesByDate } from '../lib/group-inbox-messages-by-date';
import { useInboxListScrollPreserve } from '../hooks/use-inbox-list-scroll-preserve';
import { InboxMessageListHeader } from './inbox-message-list-header';
import { InboxMessageListRow } from './inbox-message-list-row';
import { InboxNotionListRow } from './inbox-notion-list-row';
import type { InboxListFilter } from '../lib/filter-inbox-messages';

export type InboxMessageListVariant = 'workspace' | 'notion';

interface InboxMessageListProps {
  variant?: InboxMessageListVariant;
  showListTitle?: boolean;
  className?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  listFilter: InboxListFilter;
  onFilterChange: (filter: InboxListFilter) => void;
  allCount: number;
  needsAttentionCount: number;
  overdueCount: number;
  draftsCount: number;
  upToDateCount: number;
  disputesCount: number;
  filteredMessages: InboxMessage[];
  selectedId: string | null;
  onSelectMessage: (messageId: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  emptyMessage: string;
}

export function InboxMessageList({
  variant = 'workspace',
  showListTitle = true,
  className,
  searchQuery,
  onSearchChange,
  listFilter,
  onFilterChange,
  allCount,
  needsAttentionCount,
  overdueCount,
  draftsCount,
  upToDateCount,
  disputesCount,
  filteredMessages,
  selectedId,
  onSelectMessage,
  getCustomerById,
  emptyMessage
}: InboxMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const groups = groupInboxMessagesByDate(filteredMessages);

  useInboxListScrollPreserve(scrollRef, selectedId);

  return (
    <div className={cn('flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden', className)}>
      <InboxMessageListHeader
        variant={variant}
        showTitle={showListTitle}
        search={searchQuery}
        onSearchChange={onSearchChange}
        filter={listFilter}
        onFilterChange={onFilterChange}
        allCount={allCount}
        needsAttentionCount={needsAttentionCount}
        overdueCount={overdueCount}
        draftsCount={draftsCount}
        upToDateCount={upToDateCount}
        disputesCount={disputesCount}
      />

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
        <div
          ref={scrollRef}
          data-inbox-list-scroll
          className='scroll-stable min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [overflow-anchor:none]'
        >
          <LayoutGroup id={variant === 'notion' ? 'inbox-notion-list' : 'inbox-list'}>
            <div className='pb-4'>
              {groups.map((group, groupIndex) => {
                const followsToday = groupIndex > 0 && groups[groupIndex - 1]?.label === null;

                return (
                  <section
                    key={group.id}
                    className={cn(
                      group.label && groupIndex > 0 && (followsToday ? 'mt-4' : 'mt-6')
                    )}
                  >
                    {group.label ? (
                      <div
                        className={cn(
                          'sticky top-0 z-10 border-b backdrop-blur-sm',
                          variant === 'workspace'
                            ? 'border-sidebar-border bg-sidebar/95'
                            : 'border-border/60 bg-background/95'
                        )}
                      >
                        <h2
                          className={cn(
                            'px-4 py-2.5 text-xs font-medium',
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
                          <li key={message.id}>
                            <Row
                              message={message}
                              customer={msgCustomer}
                              selected={selectedId === message.id}
                              onSelectMessage={onSelectMessage}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </LayoutGroup>
        </div>
      )}
    </div>
  );
}
