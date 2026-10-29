'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { revcollectKeys, useIntegrationStatus } from '@/features/revcollect/api/queries';
import { useQueryClient } from '@tanstack/react-query';
import { connectedBooksFromStatus } from '@/lib/integrations/books-provider';
import {
  defaultZohoDataCenterIdForClient,
  ZOHO_DATA_CENTERS,
  type ZohoDataCenterId
} from '@/lib/integrations/zoho-regions';
import { toast } from 'sonner';

const ERROR_MESSAGES: Record<string, string> = {
  missing_xero_credentials:
    'Xero OAuth is not configured. Add XERO_CLIENT_ID, XERO_CLIENT_SECRET, and EMAIL_ENCRYPTION_KEY to your environment.',
  missing_intuit_credentials:
    'QuickBooks OAuth is not configured. Add INTUIT_CLIENT_ID and INTUIT_CLIENT_SECRET.',
  intuit_connect_failed:
    'Could not finish connecting QuickBooks. If Resync already works, your company is connected — reconnect is only needed to switch companies.',
  intuit_invalid_client:
    'QuickBooks Client Secret does not match the Client ID. Recopy both from Intuit → Keys & credentials → Production, update Vercel Production, redeploy, then reconnect.',
  intuit_redirect_mismatch:
    'QuickBooks redirect URI mismatch. Set INTUIT_OAUTH_REDIRECT_URI to https://app.revcollect.ai/api/integrations/quickbooks/callback on Vercel and on the Intuit Production keys tab.',
  missing_zoho_credentials:
    'Zoho OAuth is not configured. Add ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET.',
  missing_integration_storage:
    'Production storage is not configured. Add SUPABASE_SECRET_KEY on Vercel, redeploy, then reconnect.',
  integration_storage_failed:
    'Connected but could not save the token. Check SUPABASE_SECRET_KEY and the integration_secrets table.',
  xero_redirect_mismatch:
    'Xero redirect URI mismatch. Set XERO_OAUTH_REDIRECT_URI and the matching URI in the Xero developer app.',
  missing_refresh_token:
    'Zoho did not return a refresh token. Revoke this app under Zoho Accounts → Security → Connected Apps, then connect again.',
  invalid_oauth_state: 'OAuth session expired. Please try connecting again.',
  no_xero_organisation: 'No Xero organisation was returned. Check your Xero account and try again.',
  no_zoho_organisation:
    'No Zoho Books organisation on this account. Create or join one at books.zoho.in (India) or books.zoho.com, then connect again with the same login.',
  zoho_organizations_failed:
    'Zoho authorized but could not list Books organisations. Reconnect and approve all scopes (including settings). Confirm you have a Zoho Books org on this account.',
  zoho_connect_failed: 'Could not connect Zoho Books. Check your Zoho credentials and try again.',
  xero_connect_failed: 'Could not connect Xero. Check your credentials and try again.',
  books_already_connected:
    'This workspace already has a ledger connected. Disconnect it first to switch.',
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: integrationStatus, isPending } = useIntegrationStatus();
  const copy = BOOKS_COPY[provider];
  const status = integrationStatus?.[provider];
  const connected = status?.connected ?? false;
  const organisationName = status?.detail;
  const otherBooks =
    integrationStatus && !isPending ? connectedBooksFromStatus(integrationStatus) : null;
  const blocked = Boolean(otherBooks && otherBooks !== provider);
  const [zohoDc, setZohoDc] = useState<ZohoDataCenterId>(defaultZohoDataCenterIdForClient);

  useEffect(() => {
    if (blocked) {
      router.replace('/onboarding');
    }
  }, [blocked, router]);

  useEffect(() => {
    const error = searchParams.get('error');
    const detail = searchParams.get('detail');
    if (error) {
      const base = ERROR_MESSAGES[error] ?? `Could not connect ${copy.title}.`;
      toast.error(detail ? `${base} (${detail})` : base);
    }

    if (searchParams.get('connected') === '1') {
      void queryClient.removeQueries({ queryKey: revcollectKeys.inbox() });
      void queryClient.invalidateQueries({
        queryKey: revcollectKeys.integrationStatus()
      });
      toast.success(`${copy.title} connected`);
    }
  }, [copy.title, queryClient, searchParams]);

  function handleConnect() {
    const href =
      provider === 'zoho'
        ? `${copy.connectPath}?dc=${encodeURIComponent(zohoDc)}`
        : copy.connectPath;
    window.location.assign(href);
  }

  if (blocked) {
    return (
      <WorkspaceCanvas className='flex-col'>
        <WorkspacePageTitle
          className='h-8 shrink-0'
          breadcrumbs={[{ label: 'Onboarding', href: '/onboarding' }, { label: copy.title }]}
        />
        <p className='text-muted-foreground p-4 text-sm'>This workspace already has a ledger.</p>
      </WorkspaceCanvas>
    );
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
            {provider === 'zoho' ? (
              <div className='space-y-2'>
                <Label htmlFor='zoho-dc'>Zoho data center</Label>
                <Select
                  value={zohoDc}
                  onValueChange={(value) => setZohoDc(value as ZohoDataCenterId)}
                >
                  <SelectTrigger id='zoho-dc' className='w-full'>
                    <SelectValue placeholder='Select region' />
                  </SelectTrigger>
                  <SelectContent>
                    {ZOHO_DATA_CENTERS.map((dc) => (
                      <SelectItem key={dc.id} value={dc.id}>
                        {dc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className='text-muted-foreground text-xs'>
                  Pick where your Zoho Books organisation lives (same Client ID works for all
                  regions when Multi-DC is enabled).
                </p>
              </div>
            ) : null}
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
