'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { connectedBooksFromStatus } from '@/lib/integrations/books-provider';
import { useIntegrationStatus } from '../../api/queries';
import { formatLastSyncLabel } from '../../utils';
import {
  BOOKS_LEDGER_OPTIONS,
  BooksLedgerMark,
  BooksProviderPicker,
  booksConnectPath
} from './books-provider-picker';
import { IntegrationConnectToast } from './integration-connect-toast';
import { OAuthStartLink } from './oauth-start-link';
import {
  IntegrationDisconnectButton,
  IntegrationReconnectLinks,
  XeroResyncButton
} from './integration-manage-buttons';
import { SettingsSection } from './settings-section';

export function SettingsIntegrationsView() {
  const isHydrated = useIsHydrated();
  const { data: integrationStatus, isPending, isError, error, refetch } = useIntegrationStatus();
  const connectedBooks = integrationStatus ? connectedBooksFromStatus(integrationStatus) : null;
  const connectedOption = connectedBooks ? BOOKS_LEDGER_OPTIONS[connectedBooks] : null;
  const connectedItem =
    connectedBooks && integrationStatus ? integrationStatus[connectedBooks] : null;

  return (
    <div className='divide-border divide-y'>
      <Suspense fallback={null}>
        <IntegrationConnectToast />
      </Suspense>
      {isHydrated && isError ? (
        <div className='space-y-3 py-2'>
          <p className='text-destructive text-sm'>Could not load integrations.</p>
          <p className='text-muted-foreground text-sm'>
            {error instanceof Error ? error.message : 'Try again, or reconnect Xero.'}
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button size='sm' variant='outline' onClick={() => void refetch()}>
              Try again
            </Button>
            <IntegrationReconnectLinks returnTo='/settings/integrations' />
          </div>
        </div>
      ) : !isHydrated || isPending || !integrationStatus ? (
        <p className='text-muted-foreground text-sm'>Loading integrations…</p>
      ) : (
        <>
          <SettingsSection
            title={integrationStatus.gmail.label}
            leading={<Icons.inbox className='size-4' />}
            action={
              <Badge variant={integrationStatus.gmail.connected ? 'default' : 'secondary'}>
                {integrationStatus.gmail.connected ? 'Connected' : 'Not connected'}
              </Badge>
            }
            className='pb-6'
          >
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-muted-foreground text-sm'>{integrationStatus.gmail.detail}</p>
              <div className='flex flex-wrap gap-2'>
                {!integrationStatus.gmail.connected ? (
                  <Button asChild size='sm' variant='outline'>
                    <Link href='/onboarding/connect-gmail'>Connect</Link>
                  </Button>
                ) : null}
                <Button asChild size='sm' variant='outline'>
                  <OAuthStartLink href='/api/integrations/gmail/connect?returnTo=/settings/integrations'>
                    Reconnect
                  </OAuthStartLink>
                </Button>
                {integrationStatus.gmail.connected ? (
                  <IntegrationDisconnectButton provider='gmail' label='Gmail' />
                ) : null}
              </div>
            </div>
          </SettingsSection>

          {!connectedBooks ? (
            <SettingsSection
              title='Connect your ledger'
              leading={<Icons.billing className='size-4' />}
              action={<Badge variant='secondary'>Not connected</Badge>}
              className='pt-6'
            >
              <BooksProviderPicker returnTo='/settings/integrations' />
            </SettingsSection>
          ) : connectedOption && connectedItem ? (
            <SettingsSection
              title={connectedItem.label}
              leading={<BooksLedgerMark provider={connectedBooks} />}
              action={<Badge variant='default'>Connected</Badge>}
              className='pt-6'
            >
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-sm'>{connectedItem.detail}</p>
                  <p className='text-muted-foreground text-xs'>
                    {connectedItem.lastSyncAt
                      ? `Last synced ${formatLastSyncLabel(connectedItem.lastSyncAt)}`
                      : 'Never synced'}
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button asChild size='sm' variant='outline'>
                    <OAuthStartLink
                      href={booksConnectPath(connectedBooks, '/settings/integrations')}
                    >
                      {connectedOption.reconnectLabel}
                    </OAuthStartLink>
                  </Button>
                  <XeroResyncButton />
                  <IntegrationDisconnectButton
                    provider={connectedBooks}
                    label={connectedItem.label}
                  />
                </div>
              </div>
            </SettingsSection>
          ) : null}
        </>
      )}
    </div>
  );
}
