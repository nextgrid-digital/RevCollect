'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCustomers, useInboxMessages } from '../../api/queries';
import type { Customer } from '../../types';
import { filterInboxMessages, type InboxListFilter } from '../lib/filter-inbox-messages';

const VALID_FILTERS: InboxListFilter[] = ['all', 'overdue', 'drafts', 'replied', 'escalated'];

function parseInboxFilter(value: string | null): InboxListFilter | null {
  if (!value) return null;
  return VALID_FILTERS.includes(value as InboxListFilter) ? (value as InboxListFilter) : null;
}

function getListEmptyMessage(
  filter: InboxListFilter,
  searchQuery: string,
  hasResults: boolean
): string {
  if (searchQuery.trim() && !hasResults) {
    return 'No threads match your search';
  }
  if (filter === 'all') return 'No threads';
  if (filter === 'overdue') return 'No overdue threads';
  if (filter === 'drafts') return 'No AI drafts ready';
  if (filter === 'replied') return 'No replied threads';
  return 'No dispute threads';
}

export function useInboxListState() {
  const searchParams = useSearchParams();
  const urlFilter = parseInboxFilter(searchParams.get('filter'));
  const [searchQuery, setSearchQuery] = useState('');
  const [listFilter, setListFilter] = useState<InboxListFilter>(urlFilter ?? 'all');
  const { data: inboxMessages = [] } = useInboxMessages();
  const { data: customers = [] } = useCustomers();

  useEffect(() => {
    if (urlFilter) {
      setListFilter(urlFilter);
    }
  }, [urlFilter]);

  const getCustomerById = useCallback(
    (id: string): Customer | undefined => customers.find((customer) => customer.id === id),
    [customers]
  );

  const allCount = inboxMessages.length;
  const overdueCount = useMemo(
    () => inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'overdue').length,
    [inboxMessages, getCustomerById]
  );
  const draftsCount = useMemo(
    () => inboxMessages.filter((m) => m.agentDraftReady).length,
    [inboxMessages]
  );
  const repliedCount = useMemo(
    () => inboxMessages.filter((m) => !m.unread).length,
    [inboxMessages]
  );
  const disputesCount = useMemo(
    () =>
      inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'in_dispute').length,
    [inboxMessages, getCustomerById]
  );

  const filteredMessages = useMemo(
    () => filterInboxMessages(inboxMessages, listFilter, searchQuery, getCustomerById),
    [inboxMessages, listFilter, searchQuery, getCustomerById]
  );

  return {
    inboxMessages,
    searchQuery,
    setSearchQuery,
    listFilter,
    setListFilter,
    allCount,
    overdueCount,
    draftsCount,
    repliedCount,
    disputesCount,
    filteredMessages,
    getCustomerById,
    emptyMessage: getListEmptyMessage(listFilter, searchQuery, filteredMessages.length > 0)
  };
}
