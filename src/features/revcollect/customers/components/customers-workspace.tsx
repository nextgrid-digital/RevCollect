'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { workspaceListWidth } from '@/features/revcollect/lib/workspace-layout';
import { useCustomer, useCustomers } from '../../api/queries';
import { CustomersDetailPanel } from './customers-detail-panel';
import { CustomersList } from './customers-list';
import { CustomersListTitle } from './customers-list-header';
import { CustomersWorkspaceActivityColumn } from './customers-workspace-activity-column';

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

  const { data: customer } = useCustomer(activeCustomerId ?? undefined);
  const customerCompany = customer?.company ?? '…';

  useEffect(() => {
    if (isMobile || activeCustomerId || customers.length === 0) return;
    const defaultId = pickDefaultCustomerId(customers);
    if (defaultId) {
      router.replace(`/customers/${defaultId}`, { scroll: false });
    }
  }, [activeCustomerId, isMobile, customers, router]);

  const listContent = (showListTitle: boolean) => (
    <CustomersList
      selectedId={activeCustomerId}
      showListTitle={showListTitle}
      className='min-h-0 flex-1'
    />
  );

  const listColumnDesktop = (
    <div className={cn('hidden min-h-0 min-w-0 flex-col gap-2 md:flex', workspaceListWidth)}>
      <CustomersListTitle className='h-8' />
      <WorkspaceCard variant='list' className='min-h-0 w-full min-w-0 flex-1'>
        {listContent(false)}
      </WorkspaceCard>
    </div>
  );

  const detailPanel = activeCustomerId ? (
    <CustomersDetailPanel
      customerId={activeCustomerId}
      hideActivityAside
      className='bg-background min-h-0 min-w-0 flex-1 overflow-hidden'
    />
  ) : (
    <div className='text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm'>
      Select a customer to get started
    </div>
  );

  const desktopWorkspace = activeCustomerId ? (
    <div className='flex min-h-0 min-w-0 flex-1 gap-4'>
      {detailPanel}
      <CustomersWorkspaceActivityColumn customerId={activeCustomerId} />
    </div>
  ) : (
    detailPanel
  );

  return (
    <WorkspaceCanvas>
      {isMobile ? (
        <div className='flex min-h-0 min-w-0 flex-1 flex-col gap-2 md:hidden'>
          {activeCustomerId ? (
            <WorkspacePageTitle
              className='h-8 shrink-0'
              breadcrumbs={[{ label: 'Customers', href: '/customers' }, { label: customerCompany }]}
            />
          ) : (
            <CustomersListTitle className='h-8 shrink-0' />
          )}
          {showListOnMobile ? (
            <WorkspaceCard variant='list' className='min-h-0 w-full min-w-0 flex-1'>
              {listContent(false)}
            </WorkspaceCard>
          ) : null}
          {showDetailOnMobile ? detailPanel : null}
        </div>
      ) : (
        <>
          {listColumnDesktop}
          {desktopWorkspace}
        </>
      )}
    </WorkspaceCanvas>
  );
}
