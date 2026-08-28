import { WorkspaceCard } from '@/components/layout/workspace-card';
import { formatCurrencyWhole } from '../../utils';
import type { DashboardKpis } from '../lib/build-dashboard-snapshot';

interface DashboardKpiRowProps {
  kpis: DashboardKpis;
}

export function DashboardKpiRow({ kpis }: DashboardKpiRowProps) {
  const items = [
    {
      label: 'Total AR',
      value: formatCurrencyWhole(kpis.totalArCents),
      hint: `${kpis.invoiceCount} invoice${kpis.invoiceCount === 1 ? '' : 's'}`
    },
    {
      label: 'You collect at',
      value: `${kpis.collectAtDays.toFixed(1)}d`,
      hint: `Terms ${kpis.termsDays}d`
    },
    {
      label: 'Cash locked by the gap',
      value: formatCurrencyWhole(kpis.cashLockedCents),
      hint: `${formatCurrencyWhole(kpis.overdueCents)} past due`
    },
    {
      label: 'Collected this week',
      value: formatCurrencyWhole(kpis.collectedThisWeekCents),
      hint: 'Cash in from open AR'
    }
  ];

  return (
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      {items.map((item) => (
        <WorkspaceCard key={item.label} className='p-4 md:p-5'>
          <p className='text-muted-foreground text-[11px] font-medium'>{item.label}</p>
          <p className='mt-2 text-2xl font-semibold tracking-tight tabular-nums'>{item.value}</p>
          <p className='text-muted-foreground mt-1 text-xs'>{item.hint}</p>
        </WorkspaceCard>
      ))}
    </div>
  );
}
