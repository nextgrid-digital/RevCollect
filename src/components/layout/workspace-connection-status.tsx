'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIsMutating, useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  BOOKS_RESYNC_MUTATION_KEY,
  integrationStatusQueryOptions
} from '@/features/revcollect/api/queries';
import { formatLastSyncLabel } from '@/features/revcollect/utils';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import type { IntegrationStatus } from '@/features/revcollect/types';

const SYNCED_LABEL_TICK_MS = 15_000;
const WAITING_STATUS_POLL_MS = 5_000;
const SYNCED_STATUS_POLL_MS = 60_000;

function booksLastSyncAt(status: IntegrationStatus): string | null {
  return status.xero.lastSyncAt ?? status.quickbooks.lastSyncAt ?? status.zoho.lastSyncAt ?? null;
}

function booksConnectedFromStatus(status: IntegrationStatus): boolean {
  return status.xero.connected || status.quickbooks.connected || status.zoho.connected;
}

export function WorkspaceConnectionStatus() {
  const isHydrated = useIsHydrated();
  const [now, setNow] = useState(() => Date.now());
  const resyncing = useIsMutating({ mutationKey: BOOKS_RESYNC_MUTATION_KEY }) > 0;
  const { data: integrationStatus } = useQuery({
    ...integrationStatusQueryOptions(),
    refetchInterval: (query) => {
      const status = query.state.data;
      if (!status || !booksConnectedFromStatus(status)) return false;
      return booksLastSyncAt(status) ? SYNCED_STATUS_POLL_MS : WAITING_STATUS_POLL_MS;
    },
    refetchIntervalInBackground: false
  });

  const booksConnected = integrationStatus ? booksConnectedFromStatus(integrationStatus) : false;
  const lastSyncAt = integrationStatus ? booksLastSyncAt(integrationStatus) : null;

  useEffect(() => {
    if (!lastSyncAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), SYNCED_LABEL_TICK_MS);
    return () => window.clearInterval(timer);
  }, [lastSyncAt]);

  if (!isHydrated || !integrationStatus) return null;

  const syncing = booksConnected && !lastSyncAt && resyncing;
  const lastSyncLabel = lastSyncAt
    ? `Synced ${formatLastSyncLabel(lastSyncAt, now)}`
    : syncing
      ? 'Syncing…'
      : booksConnected
        ? 'Waiting for sync'
        : 'Never synced';

  return (
    <Link
      href='/settings/integrations'
      aria-label='Connection and sync status'
      className='flex shrink-0 items-center rounded-md focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
      title={
        lastSyncAt
          ? `Last synced ${new Date(lastSyncAt).toLocaleString('en-US')}`
          : syncing
            ? 'Syncing accounting data'
            : booksConnected
              ? 'Ledger connected but no AR data yet — open Settings to resync'
              : 'Accounting has not synced yet'
      }
    >
      <span
        className={cn(
          'inline-flex max-w-[11rem] items-center gap-1 truncate rounded-full px-2 py-1 text-xs font-medium',
          lastSyncAt
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {syncing ? (
          <Icons.spinner className='size-3.5 shrink-0 animate-spin' aria-hidden />
        ) : (
          <Icons.clock className='size-3.5 shrink-0' aria-hidden />
        )}
        <span className='truncate'>{lastSyncLabel}</span>
      </span>
    </Link>
  );
}
