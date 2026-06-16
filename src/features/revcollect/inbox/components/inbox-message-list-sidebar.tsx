'use client';

import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import type { Customer, InboxMessage } from '../../types';
import type { InboxListFilter } from '../lib/filter-inbox-messages';
import { InboxMessageListHeader } from './inbox-message-list-header';
import { InboxMessageListRow } from './inbox-message-list-row';

interface InboxMessageListSidebarProps {
  showHeader?: boolean;
  listHeaderClassName?: string;
  visible: boolean;
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
  selectedId: string;
  onSelectMessage: (messageId: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  emptyMessage: string;
}

export function InboxMessageListSidebar({
  showHeader = true,
  listHeaderClassName,
  visible,
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
}: InboxMessageListSidebarProps) {
  return (
    <Sidebar
      side='left'
      collapsible='none'
      className={cn(
        'h-full min-h-0 overflow-hidden border-r',
        'w-full min-w-0 flex-1 md:w-[22rem] md:flex-none md:shrink-0',
        visible ? 'flex' : 'hidden md:flex'
      )}
    >
      {showHeader ? (
        <SidebarHeader
          className={cn(
            'border-border/60 flex min-h-0 flex-col justify-center border-b py-2',
            listHeaderClassName
          )}
        >
          <InboxMessageListHeader
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
        </SidebarHeader>
      ) : null}
      <SidebarContent
        data-inbox-list-scroll
        className='scroll-stable overflow-y-auto py-1 pr-2 [overflow-anchor:none] md:pr-3'
      >
        {filteredMessages.length === 0 ? (
          <p className='text-muted-foreground px-2 py-8 text-center text-sm'>{emptyMessage}</p>
        ) : (
          <ul className='divide-y'>
            {filteredMessages.map((message) => {
              const msgCustomer = getCustomerById(message.customerId);
              if (!msgCustomer) return null;

              return (
                <InboxMessageListRow
                  key={message.id}
                  message={message}
                  customer={msgCustomer}
                  selected={selectedId === message.id}
                  onSelectMessage={onSelectMessage}
                />
              );
            })}
          </ul>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
