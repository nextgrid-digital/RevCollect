'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  revcollectKeys,
  useCustomers,
  useInboxMessages,
  useIntegrationStatus
} from '../../api/queries';
import { useAutoResyncWhenEmpty } from '../../hooks/use-auto-resync-when-empty';
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
  hasResults: boolean,
  options: { booksConnected: boolean; isResyncing: boolean }
): string {
  if (searchQuery.trim() && !hasResults) {
    return 'No threads match your search';
  }
  if (filter === 'all') {
    if (options.isResyncing) {
      return 'Syncing open invoices from your ledger…';
    }
    if (options.booksConnected) {
      return 'No open invoices yet. Sync again from Settings if invoices should appear.';
    }
    return 'No open customers yet. Connect your ledger in Settings to pull open invoices.';
  }
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
  const queryClient = useQueryClient();
  const listFilter = parseInboxFilter(searchParams.get('filter')) ?? 'all';
  const searchQuery = parseInboxSearch(searchParams.get('q'));
  const [searchDraft, setSearchDraft] = useState(searchQuery);
  const { data: inboxMessages = [] } = useInboxMessages();
  const { data: customers = [], isFetched: customersFetched } = useCustomers();
  const { data: integrationStatus } = useIntegrationStatus();
  const { isResyncing } = useAutoResyncWhenEmpty();
  const staleInboxClearedRef = useRef(false);
  const booksConnected = Boolean(
    integrationStatus?.xero.connected ||
    integrationStatus?.quickbooks.connected ||
    integrationStatus?.zoho.connected
  );

  // After ledger id remap, persisted inbox rows may not match any customer.
  // Drop the stale cache once so the next fetch rebuilds synthetic threads.
  useEffect(() => {
    if (staleInboxClearedRef.current) return;
    if (!customersFetched || customers.length === 0 || inboxMessages.length === 0) return;
    const matched = inboxMessages.some((message) =>
      customers.some((customer) => customer.id === message.customerId)
    );
    if (matched) return;
    staleInboxClearedRef.current = true;
    queryClient.removeQueries({ queryKey: revcollectKeys.inbox() });
    void queryClient.invalidateQueries({ queryKey: revcollectKeys.inbox() });
  }, [customers, customersFetched, inboxMessages, queryClient]);

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

  // Prefer matched rows when customers are loaded so stale persisted ids don't inflate "All".
  const matchedInboxCount = useMemo(() => {
    if (customers.length === 0) return inboxMessages.length;
    return inboxMessages.filter((message) =>
      customers.some((customer) => customer.id === message.customerId)
    ).length;
  }, [customers, inboxMessages]);
  const allCount = matchedInboxCount > 0 ? matchedInboxCount : inboxMessages.length;
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
    emptyMessage: getListEmptyMessage(listFilter, searchDraft, filteredMessages.length > 0, {
      booksConnected,
      isResyncing
    })
  };
}
