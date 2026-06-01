'use client';

import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { StatusPill } from '../../components/status-pill';
import type { Customer, InboxMessage } from '../../types';
import { formatRelativeDate } from '../../utils';
import type { InboxListFilter } from '../lib/filter-inbox-messages';
import { InboxMessageListHeader } from './inbox-message-list-header';

interface InboxMessageListSidebarProps {
  showHeader?: boolean;
  listHeaderClassName?: string;
  visible: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  listFilter: InboxListFilter;
  onFilterChange: (filter: InboxListFilter) => void;
  allCount: number;
  overdueCount: number;
  dueSoonCount: number;
  escalatedCount: number;
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
  overdueCount,
  dueSoonCount,
  escalatedCount,
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
            overdueCount={overdueCount}
            dueSoonCount={dueSoonCount}
            escalatedCount={escalatedCount}
          />
        </SidebarHeader>
      ) : null}
      <SidebarContent className='scroll-stable overflow-y-auto py-1 pr-2 md:pr-3'>
        {filteredMessages.length === 0 ? (
          <p className='text-muted-foreground px-2 py-8 text-center text-sm'>{emptyMessage}</p>
        ) : (
          <ul className='divide-y'>
            {filteredMessages.map((message) => {
              const msgCustomer = getCustomerById(message.customerId);
              if (!msgCustomer) return null;

              return (
                <li key={message.id}>
                  <button
                    type='button'
                    onClick={() => onSelectMessage(message.id)}
                    className={cn(
                      'hover:bg-muted/50 flex w-full gap-3 px-3 py-3 text-left transition-colors',
                      selectedId === message.id && 'bg-muted'
                    )}
                  >
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className={cn('truncate text-sm', message.unread && 'font-semibold')}>
                          {msgCustomer.company}
                        </span>
                        <time className='text-muted-foreground shrink-0 text-xs'>
                          {formatRelativeDate(message.receivedAt)}
                        </time>
                      </div>
                      <p className='truncate text-sm'>{message.subject}</p>
                      <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                        {message.preview}
                      </p>
                      <div className='mt-2'>
                        <StatusPill status={msgCustomer.status} />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
