'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGroup } from 'motion/react';
import { cn } from '@/lib/utils';
import { useCustomersListScrollPreserve } from '../hooks/use-customers-list-scroll-preserve';
import { useCustomersListState } from '../hooks/use-customers-list-state';
import { CustomersListHeader } from './customers-list-header';
import { CustomersListRow } from './customers-list-row';

interface CustomersListProps {
  selectedId: string | null;
  showListTitle?: boolean;
  className?: string;
}

export function CustomersList({ selectedId, showListTitle = true, className }: CustomersListProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const listState = useCustomersListState();

  useCustomersListScrollPreserve(scrollRef, selectedId);

  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}>
      <CustomersListHeader
        showTitle={showListTitle}
        search={listState.searchQuery}
        onSearchChange={listState.setSearchQuery}
        filter={listState.riskFilter}
        onFilterChange={listState.setRiskFilter}
        allCount={listState.counts.all}
        highCount={listState.counts.high}
        watchCount={listState.counts.watch}
        healthyCount={listState.counts.healthy}
      />

      <div
        ref={scrollRef}
        data-customers-list-scroll
        className='scroll-stable min-h-0 flex-1 overflow-x-hidden overflow-y-auto [overflow-anchor:none]'
      >
        {listState.isPending ? (
          <p className='text-sidebar-foreground/70 px-4 py-12 text-center text-sm'>Loading…</p>
        ) : listState.isError ? (
          <div className='space-y-2 px-4 py-12 text-center text-sm'>
            <p className='text-destructive'>Could not load customers from Xero.</p>
            <p className='text-muted-foreground'>
              {listState.errorMessage ?? 'Reconnect Xero in Settings → Integrations.'}
            </p>
          </div>
        ) : listState.filteredCustomers.length === 0 ? (
          <p className='text-sidebar-foreground/70 px-4 py-12 text-center text-sm'>
            {listState.emptyMessage}
          </p>
        ) : (
          <LayoutGroup id='customers-list'>
            <ul className='pb-4'>
              {listState.filteredCustomers.map((customer) => (
                <li key={customer.id}>
                  <CustomersListRow
                    customer={customer}
                    riskTier={listState.getRiskTier(customer)}
                    selected={selectedId === customer.id}
                    onSelect={() => router.push(`/customers/${customer.id}`, { scroll: false })}
                  />
                </li>
              ))}
            </ul>
          </LayoutGroup>
        )}
      </div>
    </div>
  );
}
