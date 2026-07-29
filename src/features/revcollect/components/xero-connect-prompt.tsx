'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useIntegrationStatus } from '@/features/revcollect/api/queries';

export function XeroConnectPrompt({ className }: { className?: string }) {
  const { data: status, isPending } = useIntegrationStatus();

  if (isPending) return null;
  if (status?.xero.connected) return null;

  return (
    <div
      className={
        className ??
        'border-border bg-muted/40 flex flex-col items-start gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between'
      }
    >
      <div className='space-y-1'>
        <p className='text-sm font-medium'>Connect Xero to load real customers and invoices</p>
        <p className='text-muted-foreground text-sm'>
          Accounts receivable data comes from your Xero organisation. Only customers with open
          invoice balances are shown.
        </p>
      </div>
      <Button asChild size='sm' className='shrink-0'>
        <Link href='/onboarding/connect-xero'>
          <Icons.add className='size-4' />
          Connect Xero
        </Link>
      </Button>
    </div>
  );
}
