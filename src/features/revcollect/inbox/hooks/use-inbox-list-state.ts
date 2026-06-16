'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCustomers, useInboxMessages } from '../../api/queries';
import type { Customer } from '../../types';
import { filterInboxMessages, type InboxListFilter } from '../lib/filter-inbox-messages';
import {
  buildInboxPathForPathname,
  parseInboxFilter,
  parseInboxSearch
} from '../lib/inbox-list-query';
import {
  getInboxThreadActionStatus,
  threadNeedsAttention
} from '../lib/get-inbox-thread-action-status';

const SEARCH_DEBOUNCE_MS = 250;

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listFilter = parseInboxFilter(searchParams.get('filter')) ?? 'all';
  const searchQuery = parseInboxSearch(searchParams.get('q'));
  const [searchDraft, setSearchDraft] = useState(searchQuery);
  const { data: inboxMessages = [] } = useInboxMessages();
  const { data: customers = [] } = useCustomers();

  useEffect(() => {
    setSearchDraft(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (searchDraft === searchQuery) return;

    const timeoutId = window.setTimeout(() => {
      router.replace(buildInboxPathForPathname(pathname, searchParams, { search: searchDraft }), {
        scroll: false
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, router, searchDraft, searchParams, searchQuery]);

  const setListFilter = useCallback(
    (filter: InboxListFilter) => {
      router.replace(buildInboxPathForPathname(pathname, searchParams, { filter }), {
        scroll: false
      });
    },
    [pathname, router, searchParams]
  );

  const setSearchQuery = useCallback((value: string) => {
    setSearchDraft(value);
  }, []);

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
    () => filterInboxMessages(inboxMessages, listFilter, searchDraft, getCustomerById),
    [inboxMessages, listFilter, searchDraft, getCustomerById]
  );

  return {
    inboxMessages,
    searchQuery: searchDraft,
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
    emptyMessage: getListEmptyMessage(listFilter, searchDraft, filteredMessages.length > 0)
  };
}
