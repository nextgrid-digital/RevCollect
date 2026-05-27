import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { integrationStatus } from '../../mock-data';

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

export function OnboardingSteps() {
  return (
    <div className='grid max-w-2xl gap-4'>
      {steps.map((step) => (
        <Card key={step.title}>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              {step.done ? (
                <Icons.check className='text-primary size-5' />
              ) : (
                <Icons.circle className='text-muted-foreground size-5' />
              )}
              {step.title}
            </CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant={step.done ? 'outline' : 'default'} size='sm'>
              <Link href={step.href}>{step.done ? 'View' : 'Continue'}</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
