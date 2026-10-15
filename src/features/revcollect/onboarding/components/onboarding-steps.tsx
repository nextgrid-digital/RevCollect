'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { Icons } from '@/components/icons';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { Button } from '@/components/ui/button';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { connectedBooksFromStatus } from '@/lib/integrations/books-provider';
import { useIntegrationStatus } from '../../api/queries';
import {
  BOOKS_LEDGER_OPTIONS,
  BooksLedgerMark,
  BooksProviderPicker,
  booksConnectPath
} from '../../settings/components/books-provider-picker';
import { IntegrationConnectToast } from '../../settings/components/integration-connect-toast';
import { OAuthStartLink } from '../../settings/components/oauth-start-link';
import {
  IntegrationDisconnectButton,
  IntegrationReconnectLinks,
  XeroResyncButton
} from '../../settings/components/integration-manage-buttons';
import { formatLastSyncLabel } from '../../utils';

function OnboardingHeader() {
  return (
    <WorkspacePageTitle
      title='Onboarding'
      className='h-8 shrink-0'
      actions={
        <Button asChild size='sm' variant='outline'>
          <Link href='/settings/integrations'>Integrations</Link>
        </Button>
      }
    />
  );
}

function StepStatusIcon({ done }: { done: boolean }) {
  return done ? (
    <Icons.check className='text-primary size-4' />
  ) : (
    <span className='bg-muted size-4 rounded-full' />
  );
}

export function OnboardingSteps() {
  const isHydrated = useIsHydrated();
  const { data: integrationStatus, isPending, isError, error, refetch } = useIntegrationStatus();

  if (!isHydrated) {
    return (
      <WorkspaceCanvas className='flex-col'>
        <OnboardingHeader />
        <p className='text-muted-foreground text-sm'>Loading onboarding steps…</p>
      </WorkspaceCanvas>
    );
  }

  if (isError) {
    return (
      <WorkspaceCanvas className='flex-col'>
        <OnboardingHeader />
        <div className='space-y-3'>
          <p className='text-destructive text-sm'>Could not load integrations.</p>
          <p className='text-muted-foreground text-sm'>
            {error instanceof Error ? error.message : 'Try again, or reconnect Xero in Settings.'}
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button size='sm' onClick={() => void refetch()}>
              Try again
            </Button>
            <IntegrationReconnectLinks returnTo='/onboarding' />
            <Button asChild size='sm' variant='outline'>
              <Link href='/settings/integrations'>Open Integrations</Link>
            </Button>
          </div>
        </div>
      </WorkspaceCanvas>
    );
  }

  if (isPending || !integrationStatus) {
    return (
      <WorkspaceCanvas className='flex-col'>
        <OnboardingHeader />
        <p className='text-muted-foreground text-sm'>Loading onboarding steps…</p>
      </WorkspaceCanvas>
    );
  }

  const connectedBooks = connectedBooksFromStatus(integrationStatus);
  const connectedOption = connectedBooks ? BOOKS_LEDGER_OPTIONS[connectedBooks] : null;
  const connectedStatus = connectedBooks ? integrationStatus[connectedBooks] : null;

  return (
    <WorkspaceCanvas className='flex-col'>
      <OnboardingHeader />
      <Suspense fallback={null}>
        <IntegrationConnectToast />
      </Suspense>
      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        <div className='mx-auto flex w-full max-w-2xl flex-col gap-4 pb-6'>
          <WorkspaceCard className='p-4 md:p-5'>
            <div className='flex flex-col gap-1'>
              <h2 className='flex items-center gap-2 text-base font-semibold'>
                <StepStatusIcon done={integrationStatus.gmail.connected} />
                Connect Gmail
              </h2>
              <p className='text-muted-foreground text-sm'>
                Send and receive collection emails from your inbox.
              </p>
            </div>
            <div className='mt-4 flex flex-wrap gap-2'>
              {!integrationStatus.gmail.connected ? (
                <Button asChild size='sm'>
                  <Link href='/onboarding/connect-gmail'>Connect</Link>
                </Button>
              ) : null}
              <Button asChild size='sm' variant='outline'>
                <OAuthStartLink href='/api/integrations/gmail/connect?returnTo=/onboarding'>
                  Reconnect
                </OAuthStartLink>
              </Button>
              {integrationStatus.gmail.connected ? (
                <IntegrationDisconnectButton provider='gmail' label='Gmail' />
              ) : null}
            </div>
          </WorkspaceCard>

          {connectedBooks && connectedOption && connectedStatus ? (
            <WorkspaceCard className='p-4 md:p-5'>
              <div className='flex flex-col gap-1'>
                <h2 className='flex items-center gap-2 text-base font-semibold'>
                  <StepStatusIcon done />
                  <BooksLedgerMark provider={connectedBooks} />
                  Connect {connectedOption.label}
                </h2>
                <p className='text-muted-foreground text-sm'>{connectedOption.description}</p>
                <p className='text-muted-foreground text-xs'>
                  {connectedStatus.lastSyncAt
                    ? `Last synced ${formatLastSyncLabel(connectedStatus.lastSyncAt)}`
                    : 'Never synced'}
                </p>
              </div>
              <div className='mt-4 flex flex-wrap gap-2'>
                <Button asChild size='sm' variant='outline'>
                  <OAuthStartLink href={booksConnectPath(connectedBooks, '/onboarding')}>
                    {connectedOption.reconnectLabel}
                  </OAuthStartLink>
                </Button>
                <XeroResyncButton />
                <IntegrationDisconnectButton
                  provider={connectedBooks}
                  label={connectedOption.label}
                />
              </div>
            </WorkspaceCard>
          ) : (
            <WorkspaceCard className='p-4 md:p-5'>
              <div className='flex flex-col gap-1'>
                <h2 className='flex items-center gap-2 text-base font-semibold'>
                  <StepStatusIcon done={false} />
                  Connect your ledger
                </h2>
              </div>
              <div className='mt-4'>
                <BooksProviderPicker returnTo='/onboarding' />
              </div>
            </WorkspaceCard>
          )}

          <WorkspaceCard className='p-4 md:p-5'>
            <div className='flex flex-col gap-1'>
              <h2 className='flex items-center gap-2 text-base font-semibold'>
                <StepStatusIcon done={false} />
                Open your dashboard
              </h2>
              <p className='text-muted-foreground text-sm'>
                See who needs attention and what ARI ran overnight.
              </p>
            </div>
            <div className='mt-4 flex flex-wrap gap-2'>
              <Button asChild size='sm'>
                <Link href={POST_LOGIN_PATH}>Continue</Link>
              </Button>
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </WorkspaceCanvas>
  );
}
