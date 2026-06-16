'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCustomers, useInboxMessages } from '../../api/queries';
import type { Customer } from '../../types';
import { filterInboxMessages, type InboxListFilter } from '../lib/filter-inbox-messages';
import {
  getInboxThreadActionStatus,
  threadNeedsAttention
} from '../lib/get-inbox-thread-action-status';

const VALID_FILTERS: InboxListFilter[] = [
  'all',
  'needs_attention',
  'overdue',
  'drafts',
  'up_to_date',
  'escalated'
];

function parseInboxFilter(value: string | null): InboxListFilter | null {
  if (!value) return null;
  if (value === 'replied') return 'up_to_date';
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
  if (filter === 'needs_attention') return 'No threads need attention';
  if (filter === 'overdue') return 'No overdue threads';
  if (filter === 'drafts') return 'No AI drafts ready';
  if (filter === 'up_to_date') return 'No up to date threads';
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
  const needsAttentionCount = useMemo(
    () =>
      inboxMessages.filter((message) => {
        const customer = getCustomerById(message.customerId);
        if (!customer) return false;
        return threadNeedsAttention(getInboxThreadActionStatus(message, customer));
      }).length,
    [inboxMessages, getCustomerById]
  );
  const overdueCount = useMemo(
    () => inboxMessages.filter((m) => getCustomerById(m.customerId)?.status === 'overdue').length,
    [inboxMessages, getCustomerById]
  );
  const draftsCount = useMemo(
    () => inboxMessages.filter((m) => m.agentDraftReady).length,
    [inboxMessages]
  );
  const upToDateCount = useMemo(
    () =>
      inboxMessages.filter((message) => {
        const customer = getCustomerById(message.customerId);
        if (!customer) return false;
        return getInboxThreadActionStatus(message, customer) === 'up_to_date';
      }).length,
    [inboxMessages, getCustomerById]
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
    needsAttentionCount,
    overdueCount,
    draftsCount,
    upToDateCount,
    disputesCount,
    filteredMessages,
    getCustomerById,
    emptyMessage: getListEmptyMessage(listFilter, searchQuery, filteredMessages.length > 0)
  };
}
