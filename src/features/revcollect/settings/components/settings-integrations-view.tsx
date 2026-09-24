'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { connectedBooksFromStatus } from '@/lib/integrations/books-provider';
import { revcollectKeys, useIntegrationStatus } from '../../api/queries';
import { formatLastSyncLabel } from '../../utils';
import {
  BOOKS_LEDGER_OPTIONS,
  BooksProviderPicker,
  booksConnectPath
} from './books-provider-picker';
import {
  IntegrationDisconnectButton,
  IntegrationReconnectLinks,
  XeroResyncButton
} from './integration-manage-buttons';
import { SettingsSection } from './settings-section';

const CONNECT_ERROR_MESSAGES: Record<string, string> = {
  missing_xero_credentials:
    'Xero OAuth is not configured. Add XERO_CLIENT_ID, XERO_CLIENT_SECRET, and EMAIL_ENCRYPTION_KEY to your environment.',
  missing_google_credentials:
    'Google OAuth is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and EMAIL_ENCRYPTION_KEY to your environment.',
  missing_integration_storage:
    'Production storage is not configured. Add SUPABASE_SECRET_KEY on Vercel, redeploy, then reconnect Xero.',
  integration_storage_failed:
    'Connected but could not save the token. Check SUPABASE_SECRET_KEY and the integration_secrets table.',
  xero_redirect_mismatch:
    'Xero redirect URI mismatch. Set XERO_OAUTH_REDIRECT_URI to https://app.revcollect.ai/api/integrations/xero/callback on Vercel and in the Xero developer app.',
  missing_refresh_token: 'OAuth did not return a refresh token. Try connecting again.',
  invalid_oauth_state: 'OAuth session expired. Please try connecting again.',
  no_xero_organisation: 'No Xero organisation was returned. Check your Xero account and try again.',
  xero_connect_failed: 'Could not connect Xero. Check your Xero credentials and try again.',
  gmail_connect_failed: 'Could not connect Gmail. Check your Google credentials and try again.',
  missing_intuit_credentials:
    'QuickBooks OAuth is not configured. Add INTUIT_CLIENT_ID and INTUIT_CLIENT_SECRET.',
  missing_zoho_credentials:
    'Zoho OAuth is not configured. Add ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET.',
  no_zoho_organisation: 'No Zoho organisation was returned. Check your Zoho account and try again.',
  books_already_connected:
    'This workspace already has a ledger connected. Disconnect it first to switch.',
  access_denied: 'Connection was cancelled.'
};

function IntegrationConnectToast() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(CONNECT_ERROR_MESSAGES[error] ?? 'Could not connect.');
    }

    if (searchParams.get('connected') === '1') {
      void queryClient.invalidateQueries({
        queryKey: revcollectKeys.integrationStatus()
      });
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.all });
      toast.success('Connected');
    }
  }, [queryClient, searchParams]);

  return null;
}

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
                  <Link href='/api/integrations/gmail/connect?returnTo=/settings/integrations'>
                    Reconnect
                  </Link>
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
              leading={<Icons.billing className='size-4' />}
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
                    <Link href={booksConnectPath(connectedBooks, '/settings/integrations')}>
                      {connectedOption.reconnectLabel}
                    </Link>
                  </Button>
                  <XeroResyncButton />
                  {connectedBooks === 'xero' ? (
                    <Button asChild size='sm' variant='outline'>
                      <Link href='/onboarding/import-invoices'>Import PDFs</Link>
                    </Button>
                  ) : null}
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
