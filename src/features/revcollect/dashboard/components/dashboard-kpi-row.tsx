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
      value: formatCurrencyWhole(kpis.totalArCents, kpis.currency),
      hint: kpis.mixedCurrency
        ? `${kpis.invoiceCount.toLocaleString('en-US')} invoices in ${kpis.currency}. Other currencies are not included.`
        : `${kpis.invoiceCount.toLocaleString('en-US')} invoice${kpis.invoiceCount === 1 ? '' : 's'}`
    },
    {
      label: 'You collect',
      value: `${kpis.collectAtDays.toFixed(1)}d`,
      hint: `Terms ${kpis.termsDays}d`
    },
    {
      label: 'Cash locked in overdue AR',
      value: formatCurrencyWhole(kpis.cashLockedCents, kpis.currency),
      hint: `Past due: ${formatCurrencyWhole(kpis.overdueCents, kpis.currency)}`
    },
    {
      label: 'Collected this week',
      value: formatCurrencyWhole(kpis.collectedThisWeekCents, kpis.currency),
      hint: 'Cash in from open AR'
    }
  ];

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
      {items.map((item) => (
        <WorkspaceCard key={item.label} className='px-5 py-5'>
          <p className='text-muted-foreground text-sm'>{item.label}</p>
          <p className='mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl'>
            {item.value}
          </p>
          <p className='text-muted-foreground mt-1.5 text-sm'>{item.hint}</p>
        </WorkspaceCard>
      ))}
    </div>
  );
}
