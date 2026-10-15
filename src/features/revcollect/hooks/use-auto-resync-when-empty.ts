'use client';

import { useEffect } from 'react';
import {
  useCustomers,
  useInboxMessages,
  useIntegrationStatus,
  useResyncXero
} from '../api/queries';

/** Session-wide guard so inbox + customers don't each fire a resync. */
let autoResyncAttempted = false;

/**
 * When books are connected but both customers and inbox are empty, trigger one
 * visible resync. Do not resync when a persisted inbox still has rows — that
 * race produced "All 17" with an empty filtered list.
 */
export function useAutoResyncWhenEmpty(): { isResyncing: boolean } {
  const { data: integrationStatus } = useIntegrationStatus();
  const { data: customers = [], isFetched: customersFetched } = useCustomers();
  const { data: inboxMessages = [], isFetched: inboxFetched } = useInboxMessages();
  const resync = useResyncXero();

  const booksConnected = Boolean(
    integrationStatus?.xero.connected ||
    integrationStatus?.quickbooks.connected ||
    integrationStatus?.zoho.connected
  );

  useEffect(() => {
    if (!customersFetched || !inboxFetched || !booksConnected) return;
    if (customers.length > 0 || inboxMessages.length > 0) return;
    if (autoResyncAttempted || resync.isPending) return;
    autoResyncAttempted = true;
    resync.mutate();
    // Intentionally omit full `resync` — mutate once per empty session.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot empty-AR recovery
  }, [
    booksConnected,
    customers.length,
    customersFetched,
    inboxFetched,
    inboxMessages.length,
    resync.isPending,
    resync.mutate
  ]);

  return { isResyncing: resync.isPending };
}
