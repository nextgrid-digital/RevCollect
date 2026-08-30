'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useIntegrationStatus } from '@/features/revcollect/api/queries';
import { formatLastSyncLabel } from '@/features/revcollect/utils';

function StatusIcon({ icon }: { icon: 'check' | 'close' | 'clock' }) {
  switch (icon) {
    case 'check':
      return <Icons.check className='size-3.5 shrink-0' aria-hidden />;
    case 'close':
      return <Icons.close className='size-3.5 shrink-0' aria-hidden />;
    case 'clock':
      return <Icons.clock className='size-3.5 shrink-0' aria-hidden />;
    default: {
      const exhaustive: never = icon;
      return exhaustive;
    }
  }
}

function StatusPill({
  connected,
  label,
  title,
  icon
}: {
  connected: boolean;
  label: string;
  title?: string;
  icon: 'check' | 'close' | 'clock';
}) {
  return (
    <span
      title={title ?? label}
      className={cn(
        'inline-flex max-w-[11rem] items-center gap-1 truncate rounded-full px-2 py-1 text-xs font-medium',
        connected
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <StatusIcon icon={icon} />
      <span className='truncate'>{label}</span>
    </span>
  );
}

export function WorkspaceConnectionStatus() {
  const { data: integrationStatus } = useIntegrationStatus();

  if (!integrationStatus) return null;

  const { xero, gmail } = integrationStatus;
  const lastSyncAt = xero.lastSyncAt ?? null;
  const lastSyncLabel = lastSyncAt ? `Synced ${formatLastSyncLabel(lastSyncAt)}` : 'Never synced';

  return (
    <div className='flex shrink-0 items-center gap-1.5' aria-label='Connection and sync status'>
      <Link
        href='/settings/integrations'
        className='flex shrink-0 items-center gap-1.5 rounded-md focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
      >
        <StatusPill
          connected={xero.connected}
          icon={xero.connected ? 'check' : 'close'}
          label={xero.connected ? 'Xero' : 'Xero off'}
          title={xero.connected ? (xero.detail ?? 'Xero is connected') : 'Xero is not connected'}
        />
        <StatusPill
          connected={gmail.connected}
          icon={gmail.connected ? 'check' : 'close'}
          label={gmail.connected ? 'Gmail' : 'Gmail off'}
          title={
            gmail.connected ? (gmail.detail ?? 'Gmail is connected') : 'Gmail is not connected'
          }
        />
        <StatusPill
          connected={Boolean(lastSyncAt)}
          icon='clock'
          label={lastSyncLabel}
          title={
            lastSyncAt
              ? `Last synced ${new Date(lastSyncAt).toLocaleString()}`
              : 'Xero has not synced yet'
          }
        />
      </Link>
    </div>
  );
}
