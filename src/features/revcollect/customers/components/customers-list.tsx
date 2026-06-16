'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCustomersListState } from '../hooks/use-customers-list-state';
import { CustomersListHeader } from './customers-list-header';
import { CustomersListRow } from './customers-list-row';

interface CustomersListProps {
  selectedId: string | null;
  className?: string;
}

export function CustomersList({ selectedId, className }: CustomersListProps) {
  const router = useRouter();
  const listState = useCustomersListState();

  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}>
      <CustomersListHeader
        search={listState.searchQuery}
        onSearchChange={listState.setSearchQuery}
        filter={listState.riskFilter}
        onFilterChange={listState.setRiskFilter}
        allCount={listState.counts.all}
        highCount={listState.counts.high}
        watchCount={listState.counts.watch}
        healthyCount={listState.counts.healthy}
      />

      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        {listState.isPending ? (
          <p className='text-sidebar-foreground/70 px-4 py-12 text-center text-sm'>Loading…</p>
        ) : listState.filteredCustomers.length === 0 ? (
          <p className='text-sidebar-foreground/70 px-4 py-12 text-center text-sm'>
            {listState.emptyMessage}
          </p>
        ) : (
          <ul className='pb-4'>
            {listState.filteredCustomers.map((customer) => (
              <CustomersListRow
                key={customer.id}
                customer={customer}
                riskTier={listState.getRiskTier(customer)}
                selected={selectedId === customer.id}
                onSelect={() => router.push(`/customers/${customer.id}`)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
