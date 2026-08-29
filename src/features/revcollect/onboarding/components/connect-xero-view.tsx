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
  missing_integration_storage:
    'Production storage is not configured. Add SUPABASE_SECRET_KEY on Vercel, redeploy, then reconnect Xero.',
  integration_storage_failed:
    'Connected to Xero but could not save the token. Check SUPABASE_SECRET_KEY and the integration_secrets table.',
  xero_redirect_mismatch:
    'Xero redirect URI mismatch. Set XERO_OAUTH_REDIRECT_URI to https://app.revcollect.ai/api/integrations/xero/callback on Vercel and in the Xero developer app.',
  missing_refresh_token: 'Xero did not return a refresh token. Try connecting again.',
  invalid_oauth_state: 'OAuth session expired. Please try connecting again.',
  no_xero_organisation: 'No Xero organisation was returned. Check your Xero account and try again.',
  xero_connect_failed: 'Could not connect Xero. Check your Xero credentials and try again.',
  access_denied: 'Xero connection was cancelled.'
};

interface ConnectXeroViewProps {
  nextStep: {
    href: string;
    label: string;
  };
}

export function ConnectXeroView({ nextStep }: ConnectXeroViewProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: integrationStatus, isPending } = useIntegrationStatus();

  const connected = integrationStatus?.xero.connected ?? false;
  const organisationName = integrationStatus?.xero.detail;

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(ERROR_MESSAGES[error] ?? 'Could not connect Xero.');
    }

    if (searchParams.get('connected') === '1') {
      void queryClient.invalidateQueries({
        queryKey: revcollectKeys.integrationStatus()
      });
      toast.success('Xero connected');
    }
  }, [queryClient, searchParams]);

  function handleConnect() {
    window.location.assign('/api/integrations/xero/connect');
  }

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle
        className='h-8 shrink-0'
        breadcrumbs={[{ label: 'Onboarding', href: '/onboarding' }, { label: 'Xero' }]}
      />
      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        <WorkspaceCard className='mx-auto w-full max-w-lg p-4 md:p-5'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-lg font-semibold'>Xero</h2>
            <p className='text-muted-foreground text-sm'>
              Connect your organisation and RevCollect pulls open invoices, contacts, and payment
              status from Xero automatically.
            </p>
          </div>
          <div className='mt-4 space-y-4'>
            {isPending ? (
              <p className='text-muted-foreground text-sm'>Checking connection status…</p>
            ) : connected ? (
              <p className='text-sm text-emerald-600 dark:text-emerald-400'>
                Xero connected{organisationName ? ` — ${organisationName}` : ''}. Customers and
                invoices will appear on the dashboard from Xero.
              </p>
            ) : (
              <p className='text-muted-foreground text-sm'>
                You&apos;ll be redirected to Xero to authorize access to contacts, invoices, and
                payments.
              </p>
            )}
            <div className='flex flex-wrap gap-2'>
              {!connected ? <Button onClick={handleConnect}>Connect Xero</Button> : null}
              <Button variant='outline' onClick={handleConnect}>
                Reconnect
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
          </div>
        </WorkspaceCard>
      </div>
    </WorkspaceCanvas>
  );
}
