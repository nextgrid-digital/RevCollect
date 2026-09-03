'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useIntegrationStatus } from '@/features/revcollect/api/queries';
import { formatLastSyncLabel } from '@/features/revcollect/utils';
import { useIsHydrated } from '@/hooks/use-is-hydrated';

export function WorkspaceConnectionStatus() {
  const isHydrated = useIsHydrated();
  const { data: integrationStatus } = useIntegrationStatus();

  if (!isHydrated || !integrationStatus) return null;

  const lastSyncAt =
    integrationStatus.xero.lastSyncAt ??
    integrationStatus.quickbooks.lastSyncAt ??
    integrationStatus.zoho.lastSyncAt ??
    null;
  const lastSyncLabel = lastSyncAt ? `Synced ${formatLastSyncLabel(lastSyncAt)}` : 'Never synced';

  return (
    <Link
      href='/settings/integrations'
      aria-label='Connection and sync status'
      className='flex shrink-0 items-center rounded-md focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
      title={
        lastSyncAt
          ? `Last synced ${new Date(lastSyncAt).toLocaleString('en-US')}`
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
        <Icons.clock className='size-3.5 shrink-0' aria-hidden />
        <span className='truncate'>{lastSyncLabel}</span>
      </span>
    </Link>
  );
}
