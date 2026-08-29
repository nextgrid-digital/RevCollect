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
  missing_google_credentials:
    'Google OAuth is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and EMAIL_ENCRYPTION_KEY to your environment.',
  missing_refresh_token:
    'Google did not return a refresh token. Disconnect the app in your Google account and try again.',
  invalid_oauth_state: 'OAuth session expired. Please try connecting again.',
  gmail_connect_failed: 'Could not connect Gmail. Check your Google credentials and try again.',
  access_denied: 'Gmail connection was cancelled.'
};

interface ConnectGmailViewProps {
  nextStep: {
    href: string;
    label: string;
  };
}

export function ConnectGmailView({ nextStep }: ConnectGmailViewProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: integrationStatus, isPending } = useIntegrationStatus();

  const connected = integrationStatus?.gmail.connected ?? false;
  const connectedEmail = integrationStatus?.gmail.detail;

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(ERROR_MESSAGES[error] ?? 'Could not connect Gmail.');
    }

    if (searchParams.get('connected') === '1') {
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.integrationStatus() });
      toast.success('Gmail connected');
    }
  }, [queryClient, searchParams]);

  function handleConnect() {
    window.location.assign('/api/integrations/gmail/connect');
  }

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle
        className='h-8 shrink-0'
        breadcrumbs={[{ label: 'Onboarding', href: '/onboarding' }, { label: 'Gmail' }]}
      />
      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        <WorkspaceCard className='mx-auto w-full max-w-lg p-4 md:p-5'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-lg font-semibold'>Gmail</h2>
            <p className='text-muted-foreground text-sm'>
              Connect the mailbox your team uses for customer outreach.
            </p>
          </div>
          <div className='mt-4 space-y-4'>
            {isPending ? (
              <p className='text-muted-foreground text-sm'>Checking connection status…</p>
            ) : connected ? (
              <p className='text-sm text-emerald-600 dark:text-emerald-400'>
                Gmail connected{connectedEmail ? ` as ${connectedEmail}` : ''}.
              </p>
            ) : (
              <p className='text-muted-foreground text-sm'>
                You&apos;ll be redirected to Google to authorize send and read access for
                collections email.
              </p>
            )}
            <div className='flex flex-wrap gap-2'>
              {!connected ? <Button onClick={handleConnect}>Connect Gmail</Button> : null}
              {connected ? (
                <Button variant='outline' onClick={handleConnect}>
                  Reconnect
                </Button>
              ) : null}
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
