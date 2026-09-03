'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { Button } from '@/components/ui/button';
import { revcollectKeys, useIntegrationStatus } from '@/features/revcollect/api/queries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const ERROR_MESSAGES: Record<string, string> = {
  missing_xero_credentials:
    'Xero OAuth is not configured. Add XERO_CLIENT_ID, XERO_CLIENT_SECRET, and EMAIL_ENCRYPTION_KEY to your environment.',
  missing_intuit_credentials:
    'QuickBooks OAuth is not configured. Add INTUIT_CLIENT_ID and INTUIT_CLIENT_SECRET.',
  missing_zoho_credentials:
    'Zoho OAuth is not configured. Add ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET.',
  missing_integration_storage:
    'Production storage is not configured. Add SUPABASE_SECRET_KEY on Vercel, redeploy, then reconnect.',
  integration_storage_failed:
    'Connected but could not save the token. Check SUPABASE_SECRET_KEY and the integration_secrets table.',
  xero_redirect_mismatch:
    'Xero redirect URI mismatch. Set XERO_OAUTH_REDIRECT_URI and the matching URI in the Xero developer app.',
  missing_refresh_token: 'OAuth did not return a refresh token. Try connecting again.',
  invalid_oauth_state: 'OAuth session expired. Please try connecting again.',
  no_xero_organisation: 'No Xero organisation was returned. Check your Xero account and try again.',
  no_zoho_organisation: 'No Zoho organisation was returned. Check your Zoho account and try again.',
  xero_connect_failed: 'Could not connect Xero. Check your credentials and try again.',
  access_denied: 'Connection was cancelled.'
};

export type BooksConnectProvider = 'xero' | 'quickbooks' | 'zoho';

const BOOKS_COPY: Record<
  BooksConnectProvider,
  {
    title: string;
    connectLabel: string;
    reconnectLabel: string;
    disconnectLabel: string;
    connectPath: string;
    description: string;
    authorize: string;
  }
> = {
  xero: {
    title: 'Xero',
    connectLabel: 'Connect with Xero',
    reconnectLabel: 'Reconnect with Xero',
    disconnectLabel: 'Disconnect from Xero',
    connectPath: '/api/integrations/xero/connect',
    description:
      'Connect your organisation. RevCollect pulls open invoices, contacts, and payment status. You send the mail from Gmail.',
    authorize: "You'll be redirected to Xero to authorize contacts, invoices, and payments."
  },
  quickbooks: {
    title: 'QuickBooks',
    connectLabel: 'Connect QuickBooks',
    reconnectLabel: 'Reconnect QuickBooks',
    disconnectLabel: 'Disconnect QuickBooks',
    connectPath: '/api/integrations/quickbooks/connect',
    description:
      'Connect one QuickBooks Online company. RevCollect maps open invoices and payments into the same inbox as Xero.',
    authorize: "You'll be redirected to Intuit to authorize invoices, customers, and payments."
  },
  zoho: {
    title: 'Zoho Books',
    connectLabel: 'Connect Zoho Books',
    reconnectLabel: 'Reconnect Zoho Books',
    disconnectLabel: 'Disconnect Zoho Books',
    connectPath: '/api/integrations/zoho/connect',
    description: 'Connect one Zoho Books organisation. Gmail remains the send channel.',
    authorize: "You'll be redirected to Zoho to authorize invoices, contacts, and payments."
  }
};

interface ConnectBooksViewProps {
  provider: BooksConnectProvider;
  nextStep: {
    href: string;
    label: string;
  };
}

export function ConnectBooksView({ provider, nextStep }: ConnectBooksViewProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: integrationStatus, isPending } = useIntegrationStatus();
  const copy = BOOKS_COPY[provider];
  const status = integrationStatus?.[provider];
  const connected = status?.connected ?? false;
  const organisationName = status?.detail;

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(ERROR_MESSAGES[error] ?? `Could not connect ${copy.title}.`);
    }

    if (searchParams.get('connected') === '1') {
      void queryClient.invalidateQueries({
        queryKey: revcollectKeys.integrationStatus()
      });
      toast.success(`${copy.title} connected`);
    }
  }, [copy.title, queryClient, searchParams]);

  function handleConnect() {
    window.location.assign(copy.connectPath);
  }

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle
        className='h-8 shrink-0'
        breadcrumbs={[{ label: 'Onboarding', href: '/onboarding' }, { label: copy.title }]}
      />
      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        <WorkspaceCard className='mx-auto w-full max-w-lg p-4 md:p-5'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-lg font-semibold'>{copy.title}</h2>
            <p className='text-muted-foreground text-sm'>{copy.description}</p>
          </div>
          <div className='mt-4 space-y-4'>
            {isPending ? (
              <p className='text-muted-foreground text-sm'>Checking connection status…</p>
            ) : connected ? (
              <div className='space-y-1'>
                <p className='text-sm font-medium'>Connected</p>
                <p className='text-muted-foreground text-sm'>
                  Organisation: {organisationName ?? copy.title}
                </p>
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>{copy.authorize}</p>
            )}
            <div className='flex flex-wrap gap-2'>
              {!connected ? <Button onClick={handleConnect}>{copy.connectLabel}</Button> : null}
              <Button variant='outline' onClick={handleConnect}>
                {copy.reconnectLabel}
              </Button>
              <Button asChild variant='outline'>
                <Link href='/onboarding'>Back to onboarding</Link>
              </Button>
              {connected ? (
                <Button asChild>
                  <Link href={nextStep.href}>{nextStep.label}</Link>
                </Button>
              ) : null}
            </div>
            {connected && provider === 'xero' ? (
              <p className='text-muted-foreground text-xs'>
                To disconnect, use Settings → Integrations ({copy.disconnectLabel}). If you revoked
                access in Xero Connected Apps, reconnect here.
              </p>
            ) : null}
          </div>
        </WorkspaceCard>
      </div>
    </WorkspaceCanvas>
  );
}
