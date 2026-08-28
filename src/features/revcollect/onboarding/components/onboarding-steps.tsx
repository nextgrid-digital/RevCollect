'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { Button } from '@/components/ui/button';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';
import { useIntegrationStatus } from '../../api/queries';

export function OnboardingSteps() {
  const { data: integrationStatus, isPending } = useIntegrationStatus();

  if (isPending || !integrationStatus) {
    return (
      <WorkspaceCanvas className='flex-col'>
        <WorkspacePageTitle title='Onboarding' className='h-8 shrink-0' />
        <p className='text-muted-foreground text-sm'>Loading onboarding steps…</p>
      </WorkspaceCanvas>
    );
  }

  const steps = [
    {
      title: 'Connect Gmail',
      description: 'Send and receive collection emails from your inbox.',
      href: '/onboarding/connect-gmail',
      done: integrationStatus.gmail.connected
    },
    {
      title: 'Connect Xero',
      description: 'Customers, invoices, and payment status sync from your organisation.',
      href: '/onboarding/connect-xero',
      done: integrationStatus.xero.connected
    },
    {
      title: 'Open your dashboard',
      description: 'See who needs attention and what Chase ran overnight.',
      href: POST_LOGIN_PATH,
      done: false
    }
  ];

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle title='Onboarding' className='h-8 shrink-0' />
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
              </div>
              {!step.done ? (
                <div className='mt-4'>
                  <Button asChild size='sm'>
                    <Link href={step.href}>Continue</Link>
                  </Button>
                </div>
              ) : null}
            </WorkspaceCard>
          ))}
        </div>
      </div>
    </WorkspaceCanvas>
  );
}
