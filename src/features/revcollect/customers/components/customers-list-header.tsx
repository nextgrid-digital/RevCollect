'use client';

import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { CustomerRiskFilter } from '../lib/classify-customer-risk-tier';

interface CustomersListHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: CustomerRiskFilter;
  onFilterChange: (filter: CustomerRiskFilter) => void;
  allCount: number;
  highCount: number;
  watchCount: number;
  healthyCount: number;
}

export function CustomersListHeader({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  allCount,
  highCount,
  watchCount,
  healthyCount
}: CustomersListHeaderProps) {
  const filterPills: Array<{ id: CustomerRiskFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: allCount },
    { id: 'high', label: 'High risk', count: highCount },
    { id: 'watch', label: 'Watch', count: watchCount },
    { id: 'healthy', label: 'Healthy', count: healthyCount }
  ];

  return (
    <div className='border-sidebar-border shrink-0 border-b'>
      <div className='flex items-center gap-2 px-4 py-3'>
        <SidebarTrigger className='-ml-1 shrink-0' />
        <h1 className='text-sm font-semibold'>Customers</h1>
      </div>

      <div className='flex gap-1.5 overflow-x-auto px-4 pb-3 whitespace-nowrap'>
        {filterPills.map((pill) => {
          const isActive = filter === pill.id;
          return (
            <button
              key={pill.id}
              type='button'
              aria-pressed={isActive}
              onClick={() => onFilterChange(pill.id)}
              className={cn(
                'inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              )}
            >
              <span>{pill.label}</span>
              <span className='text-muted-foreground tabular-nums'>{pill.count}</span>
            </button>
          );
        })}
      </div>

      <div className='px-4 pb-3'>
        <div className='relative'>
          <Icons.search className='text-sidebar-foreground/50 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            type='search'
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search customers...'
            aria-label='Search customers'
            className='bg-sidebar-accent/50 text-sidebar-foreground placeholder:text-sidebar-foreground/50 h-9 border-0 pl-9 text-sm shadow-none'
          />
        </div>
      </div>
    </div>
  );
}
