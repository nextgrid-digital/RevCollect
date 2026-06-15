'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIntegrationStatus } from '../../api/queries';

export function OnboardingSteps() {
  const { data: integrationStatus, isPending } = useIntegrationStatus();

  if (isPending || !integrationStatus) {
    return <p className='text-muted-foreground text-sm'>Loading onboarding steps…</p>;
  }

  const steps = [
    {
      title: 'Connect QuickBooks',
      description: 'Import customers, invoices, and payment status.',
      href: '/onboarding/connect-quickbooks',
      done: integrationStatus.quickbooks.connected
    },
    {
      title: 'Connect Gmail',
      description: 'Send and receive collection emails from your inbox.',
      href: '/onboarding/connect-gmail',
      done: integrationStatus.gmail.connected
    },
    {
      title: 'Review your inbox',
      description: 'Start approving AI-drafted follow-ups.',
      href: '/inbox',
      done: false
    }
  ];

  return (
    <div className='grid max-w-2xl gap-4'>
      {steps.map((step) => (
        <Card key={step.title}>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              {step.done ? (
                <Icons.check className='text-primary size-4' />
              ) : (
                <span className='bg-muted size-4 rounded-full' />
              )}
              {step.title}
            </CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </CardHeader>
          {!step.done ? (
            <CardContent>
              <Button asChild size='sm'>
                <Link href={step.href}>Continue</Link>
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
