'use client';

import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useCustomers, useInboxMessages } from '../../api/queries';
import { useInboxOpenMode } from './inbox-open-mode-context';
import { InboxMessageList } from './inbox-message-list';
import { InboxPeekCenterDialog } from './inbox-peek-center-dialog';
import { InboxPeekSidePanel } from './inbox-peek-side-panel';
import { filterInboxMessages, type InboxListFilter } from '../lib/filter-inbox-messages';
import type { Customer } from '../../types';

function getListEmptyMessage(
  filter: InboxListFilter,
  searchQuery: string,
  hasResults: boolean
): string {
  if (searchQuery.trim() && !hasResults) {
    return 'No emails match your search';
  }
  if (filter === 'all') return 'No emails';
  if (filter === 'overdue') return 'No overdue emails';
  if (filter === 'due_soon') return 'No due soon emails';
  return 'No escalated emails';
}

export function InboxView() {
  const { mode, peekMessageId, openMessage, closePeek } = useInboxOpenMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [listFilter, setListFilter] = useState<InboxListFilter>('all');
  const { data: inboxMessages = [] } = useInboxMessages();
  const { data: customers = [] } = useCustomers();

  const getCustomerById = useCallback(
    (id: string): Customer | undefined => customers.find((customer) => customer.id === id),
    [customers]
  );

  const allCount = inboxMessages.length;
  const overdueCount = useMemo(
    () => inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'overdue').length,
    [inboxMessages, getCustomerById]
  );
  const dueSoonCount = useMemo(
    () => inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'due_soon').length,
    [inboxMessages, getCustomerById]
  );
  const escalatedCount = useMemo(
    () =>
      inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'in_dispute').length,
    [inboxMessages, getCustomerById]
  );

  const filteredMessages = useMemo(
    () => filterInboxMessages(inboxMessages, listFilter, searchQuery, getCustomerById),
    [inboxMessages, listFilter, searchQuery, getCustomerById]
  );

  const sidePeekOpen = mode === 'side' && peekMessageId !== null;
  const centerPeekOpen = mode === 'center' && peekMessageId !== null;

  return (
    <>
      <div className='flex max-h-[calc(100dvh-var(--header-height)-1rem)] min-h-0 w-full flex-1 overflow-hidden'>
        <InboxMessageList
          className={cn('min-h-0', sidePeekOpen ? 'w-[42%] shrink-0 border-r' : 'w-full flex-1')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          listFilter={listFilter}
          onFilterChange={setListFilter}
          allCount={allCount}
          overdueCount={overdueCount}
          dueSoonCount={dueSoonCount}
          escalatedCount={escalatedCount}
          filteredMessages={filteredMessages}
          selectedId={sidePeekOpen ? peekMessageId : null}
          onSelectMessage={openMessage}
          getCustomerById={getCustomerById}
          emptyMessage={getListEmptyMessage(listFilter, searchQuery, filteredMessages.length > 0)}
        />
      </div>

      {sidePeekOpen && peekMessageId ? (
        <InboxPeekSidePanel messageId={peekMessageId} onClose={closePeek} />
      ) : null}

      <InboxPeekCenterDialog
        messageId={centerPeekOpen ? peekMessageId : null}
        onClose={closePeek}
      />
    </>
  );
}
