import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MetricBlock } from '../../components/metric-block';
import { formatCurrency } from '../../utils';
import type { AgingReportSummary } from '../../types';

interface AgingSummaryStatsProps {
  summary: AgingReportSummary;
}

function DeltaText({
  value,
  suffix,
  invert = false
}: {
  value: number;
  suffix: string;
  invert?: boolean;
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isGood = invert ? isPositive : isNegative;
  const isBad = invert ? isNegative : isPositive;

  return (
    <p
      className={cn(
        'text-[11px] font-medium sm:text-xs',
        isGood && 'text-emerald-600 dark:text-emerald-400',
        isBad && 'text-red-600 dark:text-red-400',
        !isGood && !isBad && 'text-muted-foreground'
      )}
    >
      {value > 0 ? '+' : ''}
      {value}
      {suffix}
    </p>
  );
}

export function AgingSummaryStats({ summary }: AgingSummaryStatsProps) {
  return (
    <div className='grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-6 lg:grid-cols-4'>
      <MetricBlock
        label='Total AR outstanding'
        value={formatCurrency(summary.totalArCents)}
        description={<DeltaText value={summary.totalArDeltaPct} suffix='% vs last month' />}
      />
      <MetricBlock
        label='Current (not due)'
        value={formatCurrency(summary.currentCents)}
        description={<DeltaText value={summary.currentDeltaPct} suffix='% vs last month' invert />}
      />
      <MetricBlock
        label='Overdue'
        value={formatCurrency(summary.overdueCents)}
        description={<DeltaText value={summary.overdueDeltaPct} suffix='% vs last month' />}
      />
      <MetricBlock
        label='Weighted avg DSO'
        value={`${summary.weightedAvgDsoDays} days`}
        description={<DeltaText value={summary.dsoDeltaDays} suffix=' days vs target' />}
      />
    </div>
  );
}
