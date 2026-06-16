'use client';

import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { cn } from '@/lib/utils';
import { WorkspaceFilterPillsRow } from '@/features/revcollect/components/workspace-filter-pills-row';
import type { CustomerRiskFilter } from '../lib/classify-customer-risk-tier';

interface CustomersListHeaderProps {
  showTitle?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filter: CustomerRiskFilter;
  onFilterChange: (filter: CustomerRiskFilter) => void;
  allCount: number;
  highCount: number;
  watchCount: number;
  healthyCount: number;
}

export function CustomersListTitle({ className }: { className?: string }) {
  return <WorkspacePageTitle title='Customers' className={className} />;
}

export function CustomersListHeader({
  showTitle = true,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  allCount,
  highCount,
  watchCount,
  healthyCount
}: CustomersListHeaderProps) {
  const filterPills = [
    { id: 'all', label: 'All', count: allCount },
    { id: 'high', label: 'High risk', count: highCount },
    { id: 'watch', label: 'Watch', count: watchCount },
    { id: 'healthy', label: 'Healthy', count: healthyCount }
  ];

  return (
    <div className='border-sidebar-border min-w-0 shrink-0 border-b'>
      {showTitle ? (
        <div className='px-4 py-4'>
          <CustomersListTitle />
        </div>
      ) : null}

      <WorkspaceFilterPillsRow
        pills={filterPills}
        activeId={filter}
        onChange={onFilterChange}
        layoutId='customers-filter-pill'
        tone='sidebar'
        showTopPadding={!showTitle}
      />

      <div className='px-4 pb-4'>
        <div className='relative'>
          <Icons.search className='text-sidebar-foreground/50 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            type='search'
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search customers...'
            aria-label='Search customers'
            className={cn(
              'bg-sidebar-accent/50 text-sidebar-foreground placeholder:text-sidebar-foreground/50 h-9 border-0 pl-9 text-sm shadow-none'
            )}
          />
        </div>
      </div>
    </div>
  );
}
