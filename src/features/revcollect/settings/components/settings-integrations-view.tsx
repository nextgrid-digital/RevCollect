'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  revcollectKeys,
  useDisconnectIntegration,
  useIntegrationStatus,
  useResyncXero,
  type IntegrationProviderKey
} from '../../api/queries';
import { formatLastSyncLabel } from '../../utils';
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
  access_denied: 'Connection was cancelled.'
};

const integrations = [
  {
    key: 'gmail' as const,
    href: '/onboarding/connect-gmail',
    connectPath: '/api/integrations/gmail/connect?returnTo=/settings/integrations',
    icon: Icons.inbox
  },
  {
    key: 'xero' as const,
    href: '/onboarding/connect-xero',
    connectPath: '/api/integrations/xero/connect?returnTo=/settings/integrations',
    icon: Icons.billing
  },
  {
    key: 'stripe' as const,
    href: '/settings/billing',
    connectPath: null,
    icon: Icons.billing
  }
];

function IntegrationConnectToast() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(CONNECT_ERROR_MESSAGES[error] ?? 'Could not connect.');
    }

    if (searchParams.get('connected') === '1') {
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.integrationStatus() });
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.all });
      toast.success('Connected');
    }
  }, [queryClient, searchParams]);

  return null;
}

function DisconnectButton({
  provider,
  label
}: {
  provider: IntegrationProviderKey;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const disconnect = useDisconnectIntegration();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size='sm' variant='outline'>
          Disconnect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            {provider === 'xero'
              ? 'You can reconnect later. Existing invoices stay in RevCollect until you resync from Xero.'
              : 'You can reconnect later. RevCollect will stop sending and reading mail from this account.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={disconnect.isPending}
            onClick={(event) => {
              event.preventDefault();
              disconnect.mutate(provider, {
                onSuccess: () => setOpen(false)
              });
            }}
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function XeroResyncButton() {
  const resync = useResyncXero();
  return (
    <Button
      size='sm'
      variant='outline'
      isLoading={resync.isPending}
      onClick={() => resync.mutate()}
    >
      Resync
    </Button>
  );
}

export function SettingsIntegrationsView() {
  const { data: integrationStatus, isPending, isError, error, refetch } = useIntegrationStatus();

  return (
    <div className='divide-border divide-y'>
      <Suspense fallback={null}>
        <IntegrationConnectToast />
      </Suspense>
      {isError ? (
        <div className='space-y-3 py-2'>
          <p className='text-destructive text-sm'>Could not load integrations.</p>
          <p className='text-muted-foreground text-sm'>
            {error instanceof Error ? error.message : 'Try again, or reconnect Xero.'}
          </p>
          <Button size='sm' variant='outline' onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : isPending || !integrationStatus ? (
        <p className='text-muted-foreground text-sm'>Loading integrations…</p>
      ) : (
        integrations.map(({ key, href, connectPath, icon: Icon }, index) => {
          const item = integrationStatus[key];
          return (
            <SettingsSection
              key={key}
              title={item.label}
              leading={<Icon className='size-4' />}
              action={
                <Badge variant={item.connected ? 'default' : 'secondary'}>
                  {item.connected ? 'Connected' : 'Not connected'}
                </Badge>
              }
              className={index === 0 ? 'pb-6' : index === integrations.length - 1 ? 'pt-6' : 'py-6'}
            >
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-sm'>{item.detail}</p>
                  {key === 'xero' && item.connected ? (
                    <p className='text-muted-foreground text-xs'>
                      {item.lastSyncAt
                        ? `Last synced ${formatLastSyncLabel(item.lastSyncAt)}`
                        : 'Never synced'}
                    </p>
                  ) : null}
                </div>
                <div className='flex flex-wrap gap-2'>
                  {!item.connected ? (
                    <Button asChild size='sm' variant='outline'>
                      <Link href={href}>Connect</Link>
                    </Button>
                  ) : null}
                  {item.connected && (key === 'xero' || key === 'gmail') && connectPath ? (
                    <Button asChild size='sm' variant='outline'>
                      <Link href={connectPath}>Reconnect</Link>
                    </Button>
                  ) : null}
                  {key === 'xero' && item.connected ? <XeroResyncButton /> : null}
                  {key === 'xero' && item.connected ? (
                    <Button asChild size='sm' variant='outline'>
                      <Link href='/onboarding/import-invoices'>Import PDFs</Link>
                    </Button>
                  ) : null}
                  {item.connected && (key === 'xero' || key === 'gmail') ? (
                    <DisconnectButton provider={key} label={item.label} />
                  ) : null}
                </div>
              </div>
            </SettingsSection>
          );
        })
      )}
    </div>
  );
}
