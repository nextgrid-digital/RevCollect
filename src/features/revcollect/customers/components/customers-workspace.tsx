'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useCustomers } from '../../api/queries';
import { CustomersDetailPanel } from './customers-detail-panel';
import { CustomersList } from './customers-list';

interface CustomersWorkspaceProps {
  customerId?: string | null;
}

function pickDefaultCustomerId(customers: { id: string; balanceCents: number }[]): string | null {
  if (customers.length === 0) return null;
  const sorted = [...customers].sort((a, b) => b.balanceCents - a.balanceCents);
  return sorted[0]?.id ?? null;
}

export function CustomersWorkspace({ customerId = null }: CustomersWorkspaceProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: customers = [] } = useCustomers();

  const activeCustomerId = customerId ?? null;
  const showListOnMobile = isMobile && !activeCustomerId;
  const showDetailOnMobile = isMobile && Boolean(activeCustomerId);

  useEffect(() => {
    if (isMobile || activeCustomerId || customers.length === 0) return;
    const defaultId = pickDefaultCustomerId(customers);
    if (defaultId) {
      router.replace(`/customers/${defaultId}`);
    }
  }, [activeCustomerId, isMobile, customers, router]);

  const listColumn = (
    <div
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border flex h-full min-h-0 flex-col overflow-hidden border-r',
        isMobile ? 'w-full' : 'w-80 shrink-0'
      )}
    >
      <CustomersList selectedId={activeCustomerId} className='min-h-0 flex-1' />
    </div>
  );

  const detailColumn = activeCustomerId ? (
    <CustomersDetailPanel customerId={activeCustomerId} className='min-h-0 min-w-0 flex-1' />
  ) : (
    <div className='text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm'>
      Select a customer to get started
    </div>
  );

  return (
    <div className='flex h-full min-h-0 w-full flex-1 overflow-hidden'>
      {isMobile ? (
        <>
          {showListOnMobile ? listColumn : null}
          {showDetailOnMobile ? (
            <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
              <div className='border-border/60 shrink-0 border-b px-4 py-2'>
                <Link
                  href='/customers'
                  className='text-primary text-sm font-medium hover:underline'
                >
                  ← Back to customers
                </Link>
              </div>
              {detailColumn}
            </div>
          ) : null}
        </>
      ) : (
        <>
          {listColumn}
          {detailColumn}
        </>
      )}
    </div>
  );
}
