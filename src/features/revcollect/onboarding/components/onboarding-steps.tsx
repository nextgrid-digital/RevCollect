'use client';

import Link from 'next/link';
import { Suspense, useMemo, type ReactNode } from 'react';
import { Icons } from '@/components/icons';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { Button } from '@/components/ui/button';
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger
} from '@/components/ui/stepper';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { connectedBooksFromStatus } from '@/lib/integrations/books-provider';
import { useCustomers, useInboxMessages, useIntegrationStatus } from '../../api/queries';
import { listNeedsYou, needsYouCountLabel } from '../../agent/lib/needs-you';
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
import type { IntegrationStatus } from '../../types';

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

function OnboardingFrame({ children }: { children: ReactNode }) {
  return (
    <WorkspaceCanvas className='flex-col'>
      <OnboardingHeader />
      {children}
    </WorkspaceCanvas>
  );
}

interface OnboardingWizardProps {
  integrationStatus: IntegrationStatus;
  needsYouCount: number;
  needsYouPending: boolean;
}

function OnboardingStepCard({
  step,
  completed,
  isLast,
  title,
  children
}: {
  step: number;
  completed: boolean;
  isLast: boolean;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <StepperItem
      step={step}
      completed={completed}
      className='relative w-full items-start not-last:flex-none'
    >
      <div className='flex w-full items-start gap-3'>
        <StepperTrigger className='z-10 size-6 shrink-0 p-0' aria-label={`Step ${step}`}>
          <StepperIndicator>{step}</StepperIndicator>
        </StepperTrigger>
        <WorkspaceCard
          className={isLast ? 'min-w-0 flex-1 p-4 md:p-5' : 'mb-4 min-w-0 flex-1 p-4 md:p-5'}
        >
          <div className='flex flex-col gap-1'>
            <StepperTitle className='text-base font-semibold'>{title}</StepperTitle>
            {children}
          </div>
        </WorkspaceCard>
      </div>
      {isLast ? null : (
        <StepperSeparator className='bg-border absolute top-7 left-3 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper-nav:h-[calc(100%-1.75rem)] group-data-[state=completed]/step:bg-primary' />
      )}
    </StepperItem>
  );
}

function OnboardingWizard({
  integrationStatus,
  needsYouCount,
  needsYouPending
}: OnboardingWizardProps) {
  const gmailConnected = integrationStatus.gmail.connected;
  const connectedBooks = connectedBooksFromStatus(integrationStatus);
  const booksConnected = Boolean(connectedBooks);
  const connectedOption = connectedBooks ? BOOKS_LEDGER_OPTIONS[connectedBooks] : null;
  const connectedStatus = connectedBooks ? integrationStatus[connectedBooks] : null;
  const bothConnected = gmailConnected && booksConnected;
  const reviewStep = bothConnected ? 3 : null;
  const dashboardStep = bothConnected ? 4 : 3;
  const initialStep = !gmailConnected ? 1 : !booksConnected ? 2 : dashboardStep;

  return (
    <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
      <div className='mx-auto flex w-full max-w-2xl flex-col pb-6'>
        <Stepper
          defaultValue={initialStep}
          orientation='vertical'
          className='w-full'
          indicators={{
            completed: <Icons.check className='size-3.5' />
          }}
        >
          <StepperNav className='w-full'>
            <OnboardingStepCard
              step={1}
              completed={gmailConnected}
              isLast={false}
              title='Connect Gmail'
            >
              <StepperDescription>
                Send and receive collection emails from your inbox.
              </StepperDescription>
              <div className='mt-4 flex flex-wrap gap-2'>
                {!gmailConnected ? (
                  <Button asChild size='sm'>
                    <Link href='/onboarding/connect-gmail'>Connect</Link>
                  </Button>
                ) : null}
                <Button asChild size='sm' variant='outline'>
                  <OAuthStartLink href='/api/integrations/gmail/connect?returnTo=/onboarding'>
                    Reconnect
                  </OAuthStartLink>
                </Button>
                {gmailConnected ? (
                  <IntegrationDisconnectButton provider='gmail' label='Gmail' />
                ) : null}
              </div>
            </OnboardingStepCard>

            <OnboardingStepCard
              step={2}
              completed={booksConnected}
              isLast={false}
              title={
                connectedBooks && connectedOption ? (
                  <span className='inline-flex items-center gap-2'>
                    <BooksLedgerMark provider={connectedBooks} />
                    Connect {connectedOption.label}
                  </span>
                ) : (
                  'Connect your ledger'
                )
              }
            >
              {connectedBooks && connectedOption && connectedStatus ? (
                <>
                  <StepperDescription>{connectedOption.description}</StepperDescription>
                  <p className='text-muted-foreground text-xs'>
                    {connectedStatus.lastSyncAt
                      ? `Last synced ${formatLastSyncLabel(connectedStatus.lastSyncAt)}`
                      : 'Never synced'}
                  </p>
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
                </>
              ) : (
                <div className='mt-4'>
                  <BooksProviderPicker returnTo='/onboarding' />
                </div>
              )}
            </OnboardingStepCard>

            {reviewStep ? (
              <OnboardingStepCard
                step={reviewStep}
                completed
                isLast={false}
                title='What needs a person'
              >
                <StepperDescription>
                  {needsYouPending
                    ? 'Checking what needs a person.'
                    : needsYouCountLabel(needsYouCount)}
                </StepperDescription>
                <div className='mt-4'>
                  <Button asChild size='sm'>
                    <Link href='/agent'>Open the Agent</Link>
                  </Button>
                </div>
              </OnboardingStepCard>
            ) : null}

            <OnboardingStepCard
              step={dashboardStep}
              completed={false}
              isLast
              title='Open your dashboard'
            >
              <StepperDescription>
                {booksConnected
                  ? 'See who needs attention and what RevCollect ran overnight.'
                  : 'Connect a ledger before opening the dashboard.'}
              </StepperDescription>
              <div className='mt-4 flex flex-wrap gap-2'>
                {booksConnected ? (
                  <Button asChild size='sm'>
                    <Link href={POST_LOGIN_PATH}>Continue</Link>
                  </Button>
                ) : (
                  <Button size='sm' disabled>
                    Continue
                  </Button>
                )}
              </div>
            </OnboardingStepCard>
          </StepperNav>
        </Stepper>
      </div>
    </div>
  );
}

export function OnboardingSteps() {
  const isHydrated = useIsHydrated();
  const { data: integrationStatus, isPending, isError, error, refetch } = useIntegrationStatus();
  const { data: messages = [], isPending: messagesPending } = useInboxMessages();
  const { data: customers = [], isPending: customersPending } = useCustomers();
  const needsYouCount = useMemo(
    () => listNeedsYou(messages, customers).length,
    [messages, customers]
  );

  if (!isHydrated) {
    return (
      <OnboardingFrame>
        <p className='text-muted-foreground text-sm'>Loading onboarding steps…</p>
      </OnboardingFrame>
    );
  }

  if (isError) {
    return (
      <OnboardingFrame>
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
      </OnboardingFrame>
    );
  }

  if (isPending || !integrationStatus) {
    return (
      <OnboardingFrame>
        <p className='text-muted-foreground text-sm'>Loading onboarding steps…</p>
      </OnboardingFrame>
    );
  }

  return (
    <OnboardingFrame>
      <Suspense fallback={null}>
        <IntegrationConnectToast />
      </Suspense>
      <OnboardingWizard
        integrationStatus={integrationStatus}
        needsYouCount={needsYouCount}
        needsYouPending={messagesPending || customersPending}
      />
    </OnboardingFrame>
  );
}
