import { MetricBlock } from '../../components/metric-block';
import { formatCurrency } from '../../utils';
import type { AgingReportSummary } from '../../types';

interface AgingSummaryStatsProps {
  summary: AgingReportSummary;
}

export function AgingSummaryStats({ summary }: AgingSummaryStatsProps) {
  // MoM deltas are not computed yet (always 0) — hide placeholder copy (B27).
  return (
    <div className='grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-6 lg:grid-cols-4'>
      <MetricBlock label='Total AR outstanding' value={formatCurrency(summary.totalArCents)} />
      <MetricBlock label='Current (not due)' value={formatCurrency(summary.currentCents)} />
      <MetricBlock label='Overdue' value={formatCurrency(summary.overdueCents)} />
      <MetricBlock
        label='Weighted avg DSO'
        value={`${summary.weightedAvgDsoDays} days`}
        description={
          <p className='text-muted-foreground text-[11px] font-medium sm:text-xs'>
            Based on open invoices today
          </p>
        }
      />
    </div>
  );
}
