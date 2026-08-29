'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { Button } from '@/components/ui/button';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';
import { useIntegrationStatus, type IntegrationProviderKey } from '../../api/queries';
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

export function OnboardingSteps() {
  const { data: integrationStatus, isPending, isError, error, refetch } = useIntegrationStatus();

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

  const steps: {
    title: string;
    description: string;
    href: string;
    done: boolean;
    provider?: IntegrationProviderKey;
    connectPath?: string;
    lastSyncAt?: string | null;
  }[] = [
    {
      title: 'Connect Gmail',
      description: 'Send and receive collection emails from your inbox.',
      href: '/onboarding/connect-gmail',
      done: integrationStatus.gmail.connected,
      provider: 'gmail',
      connectPath: '/api/integrations/gmail/connect?returnTo=/onboarding'
    },
    {
      title: 'Connect Xero',
      description: 'Customers, invoices, and payment status sync from your organisation.',
      href: '/onboarding/connect-xero',
      done: integrationStatus.xero.connected,
      provider: 'xero',
      connectPath: '/api/integrations/xero/connect?returnTo=/onboarding',
      lastSyncAt: integrationStatus.xero.lastSyncAt
    },
    {
      title: 'Open your dashboard',
      description: 'See who needs attention and what ARI ran overnight.',
      href: POST_LOGIN_PATH,
      done: false
    }
  ];

  return (
    <WorkspaceCanvas className='flex-col'>
      <OnboardingHeader />
      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        <div className='mx-auto flex w-full max-w-2xl flex-col gap-4 pb-6'>
          {steps.map((step) => (
            <WorkspaceCard key={step.title} className='p-4 md:p-5'>
              <div className='flex flex-col gap-1'>
                <h2 className='flex items-center gap-2 text-base font-semibold'>
                  {step.done ? (
                    <Icons.check className='text-primary size-4' />
                  ) : (
                    <span className='bg-muted size-4 rounded-full' />
                  )}
                  {step.title}
                </h2>
                <p className='text-muted-foreground text-sm'>{step.description}</p>
                {step.provider === 'xero' ? (
                  <p className='text-muted-foreground text-xs'>
                    {step.done
                      ? step.lastSyncAt
                        ? `Last synced ${formatLastSyncLabel(step.lastSyncAt)}`
                        : 'Never synced'
                      : 'Already connected before? Reconnect to repair it.'}
                  </p>
                ) : null}
              </div>
              <div className='mt-4 flex flex-wrap gap-2'>
                {!step.done && !step.connectPath ? (
                  <Button asChild size='sm'>
                    <Link href={step.href}>Continue</Link>
                  </Button>
                ) : null}
                {!step.done && step.connectPath ? (
                  <Button asChild size='sm'>
                    <Link href={step.href}>Connect</Link>
                  </Button>
                ) : null}
                {step.connectPath ? (
                  <Button asChild size='sm' variant='outline'>
                    <Link href={step.connectPath}>Reconnect</Link>
                  </Button>
                ) : null}
                {step.provider === 'xero' && step.done ? <XeroResyncButton /> : null}
                {step.provider && step.done ? (
                  <IntegrationDisconnectButton
                    provider={step.provider}
                    label={step.provider === 'xero' ? 'Xero' : 'Gmail'}
                  />
                ) : null}
              </div>
            </WorkspaceCard>
          ))}
        </div>
      </div>
    </WorkspaceCanvas>
  );
}
