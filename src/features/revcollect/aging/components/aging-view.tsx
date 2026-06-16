'use client';

import { useMemo, useRef, useState } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { PageHeader } from '../../components/page-header';
import { useAgingReport, useCustomers } from '../../api/queries';
import { AGING_REPORT_AS_OF_DATE } from '../lib/aging-report';
import type { AgingReportFilters } from '../../types';
import { AgingBucketBarChart } from './aging-bucket-bar-chart';
import { AgingCustomerBreakdownTable } from './aging-customer-breakdown-table';
import { AgingPriorityActionCard } from './aging-priority-action-card';
import { AgingSummaryStats } from './aging-summary-stats';
import { AgingToolbar } from './aging-toolbar';

const defaultFilters: AgingReportFilters = {
  period: 'this_month',
  sort: 'amount_desc'
};

function formatAsOfDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function AgingView() {
  const { data: customers = [] } = useCustomers();
  const breakdownRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<AgingReportFilters>(defaultFilters);
  const stableFilters = useMemo(
    () => ({
      period: filters.period,
      sort: filters.sort,
      customerId: filters.customerId
    }),
    [filters.period, filters.sort, filters.customerId]
  );

  const { data, isPending } = useAgingReport(stableFilters);

  if (isPending || !data) {
    return (
      <div className='min-w-0 space-y-6'>
        <PageHeader
          title='Aging'
          description={`Accounts receivable aging as of ${formatAsOfDate(AGING_REPORT_AS_OF_DATE)}.`}
        />
        <DataTableSkeleton
          columnCount={4}
          rowCount={4}
          withViewOptions={false}
          withPagination={false}
        />
        <DataTableSkeleton columnCount={8} rowCount={6} withViewOptions={false} />
      </div>
    );
  }

  return (
    <div className='min-w-0 space-y-6 sm:space-y-8'>
      <PageHeader
        title='Aging'
        description={`Accounts receivable aging as of ${formatAsOfDate(AGING_REPORT_AS_OF_DATE)}.`}
        actions={
          <AgingToolbar customers={customers} filters={filters} onFiltersChange={setFilters} />
        }
      />
      <AgingSummaryStats summary={data.summary} />
      <AgingPriorityActionCard
        rows={data.customerBreakdown}
        onViewAccounts={() => {
          breakdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />
      <AgingBucketBarChart buckets={data.chartBuckets} />
      <div ref={breakdownRef}>
        <AgingCustomerBreakdownTable rows={data.customerBreakdown} />
      </div>
    </div>
  );
}
