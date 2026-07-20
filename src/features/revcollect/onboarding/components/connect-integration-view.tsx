'use client';

import Link from 'next/link';
import { useState } from 'react';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ConnectIntegrationViewProps {
  title: string;
  description: string;
  provider: 'Xero' | 'Gmail';
  nextStep?: {
    href: string;
    label: string;
  };
}

export function ConnectIntegrationView({
  title,
  description,
  provider,
  nextStep
}: ConnectIntegrationViewProps) {
  const [connected, setConnected] = useState(false);

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle
        className='h-8 shrink-0'
        breadcrumbs={[{ label: 'Onboarding', href: '/onboarding' }, { label: title }]}
      />
      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        <WorkspaceCard className='mx-auto w-full max-w-lg p-4 md:p-5'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-lg font-semibold'>{title}</h2>
            <p className='text-muted-foreground text-sm'>{description}</p>
          </div>
          <div className='mt-4 space-y-4'>
            {connected ? (
              <p className='text-sm text-emerald-600 dark:text-emerald-400'>
                {provider} connected successfully (mock).
              </p>
            ) : (
              <p className='text-muted-foreground text-sm'>
                OAuth flow will be implemented with Supabase and your provider credentials.
              </p>
            )}
            <div className='flex flex-wrap gap-2'>
              {!connected ? (
                <Button
                  onClick={() => {
                    setConnected(true);
                    toast.success(`${provider} connected (mock)`);
                  }}
                >
                  Connect {provider}
                </Button>
              ) : null}
              <Button asChild variant='outline'>
                <Link href='/onboarding'>Back to onboarding</Link>
              </Button>
              {connected && nextStep ? (
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
