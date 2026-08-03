'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { revcollectKeys, useIntegrationStatus } from '@/features/revcollect/api/queries';

export function XeroConnectPrompt({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const { data: status, isPending } = useIntegrationStatus();
  const [isRefreshing, startRefresh] = useTransition();

  if (isPending) return null;

  if (!status?.xero.connected) {
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

  function handleRefresh() {
    startRefresh(async () => {
      try {
        await fetch('/api/revcollect?op=listCustomers&refresh=1');
        await queryClient.invalidateQueries({ queryKey: revcollectKeys.all });
        toast.success('Customers and invoices refreshed from Xero');
      } catch {
        toast.error('Could not refresh from Xero');
      }
    });
  }

  return (
    <div
      className={
        className ??
        'border-border bg-muted/40 flex flex-col items-start gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between'
      }
    >
      <div className='space-y-0.5'>
        <p className='text-sm font-medium'>Live from Xero</p>
        <p className='text-muted-foreground text-xs'>
          Customers, aging, and open balances are pulled from your Xero invoices.
        </p>
      </div>
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='shrink-0'
        isLoading={isRefreshing}
        onClick={handleRefresh}
      >
        <Icons.refresh className='size-4' />
        Refresh from Xero
      </Button>
    </div>
  );
}
