'use client';

import { useMemo, useRef, useState } from 'react';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { workspaceCenterMaxWidth } from '@/features/revcollect/lib/workspace-layout';
import { XeroConnectPrompt } from '@/features/revcollect/components/xero-connect-prompt';
import { MotionReveal } from '@/features/revcollect/motion/motion-primitives';
import { cn } from '@/lib/utils';
import { useAgingReport, useCustomers } from '../../api/queries';
import { AGING_REPORT_AS_OF_DATE } from '../lib/aging-report';
import type { AgingReportFilters } from '../../types';
import { AgingBucketBarChart } from './aging-bucket-bar-chart';
import { AgingCustomerBreakdownTable } from './aging-customer-breakdown-table';
import { AgingPriorityActionCard } from './aging-priority-action-card';
import { AgingSummaryStats } from './aging-summary-stats';
import { AgingToolbar } from './aging-toolbar';

const defaultFilters: AgingReportFilters = {
  period: 'all_time',
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
  const asOfLabel = formatAsOfDate(AGING_REPORT_AS_OF_DATE);
  const hasPriorityFollowUps = useMemo(
    () =>
      data?.customerBreakdown.some((row) => row.risk === 'high' || row.days60PlusCents > 0) ??
      false,
    [data?.customerBreakdown]
  );

  const toolbar = (
    <AgingToolbar customers={customers} filters={filters} onFiltersChange={setFilters} />
  );

  if (isPending || !data) {
    return (
      <WorkspaceCanvas className='flex-col'>
        <WorkspacePageTitle
          title='Aging'
          actions={toolbar}
          stackActionsBelow
          className='h-8 shrink-0'
        />
        <div
          className={cn('scroll-stable min-h-0 flex-1 overflow-y-auto', workspaceCenterMaxWidth)}
        >
          <p className='text-muted-foreground mb-6 text-sm'>
            Accounts receivable aging as of {asOfLabel}.
          </p>
          <div className='space-y-6'>
            <DataTableSkeleton
              columnCount={4}
              rowCount={4}
              withViewOptions={false}
              withPagination={false}
            />
            <DataTableSkeleton columnCount={8} rowCount={6} withViewOptions={false} />
          </div>
        </div>
      </WorkspaceCanvas>
    );
  }

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle
        title='Aging'
        actions={toolbar}
        stackActionsBelow
        className='h-8 shrink-0'
      />
      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        <div className={cn(workspaceCenterMaxWidth, 'space-y-4 pb-4')}>
          <XeroConnectPrompt />
          <p className='text-muted-foreground text-sm'>
            Accounts receivable aging as of {asOfLabel}.
          </p>

          <MotionReveal>
            <WorkspaceCard className='p-4 md:p-5'>
              <AgingSummaryStats summary={data.summary} />
            </WorkspaceCard>
          </MotionReveal>

          {hasPriorityFollowUps ? (
            <MotionReveal>
              <WorkspaceCard className='p-4 md:p-5'>
                <AgingPriorityActionCard
                  rows={data.customerBreakdown}
                  onViewAccounts={() => {
                    breakdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />
              </WorkspaceCard>
            </MotionReveal>
          ) : null}

          <MotionReveal>
            <WorkspaceCard className='p-4 md:p-5'>
              <AgingBucketBarChart buckets={data.chartBuckets} />
            </WorkspaceCard>
          </MotionReveal>

          <MotionReveal>
            <div ref={breakdownRef}>
              <WorkspaceCard className='p-4 md:p-5'>
                <AgingCustomerBreakdownTable rows={data.customerBreakdown} />
              </WorkspaceCard>
            </div>
          </MotionReveal>
        </div>
      </div>
    </WorkspaceCanvas>
  );
}
