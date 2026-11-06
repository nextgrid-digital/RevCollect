'use client';

import { motion } from 'motion/react';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { springSoft } from '@/features/revcollect/motion/motion-tokens';
import { cn } from '@/lib/utils';
import { formatCurrency, formatCurrencyWhole } from '../../utils';
import type { AgingBucket } from '../../types';
import type { DashboardAgingBar } from '../lib/build-dashboard-snapshot';

const bucketBarStyles: Record<AgingBucket, string> = {
  current: 'bg-emerald-500',
  '1-30': 'bg-violet-500',
  '31-60': 'bg-amber-400',
  '61-90': 'bg-orange-500',
  '90+': 'bg-red-500'
};

interface DashboardAgingBarsProps {
  bars: DashboardAgingBar[];
  actionCount: number;
}

export function DashboardAgingBars({ bars, actionCount }: DashboardAgingBarsProps) {
  const maxTotal = Math.max(...bars.map((bar) => bar.totalCents), 1);
  const past60Bars = bars.filter((bar) => bar.bucket === '61-90' || bar.bucket === '90+');
  const past60 = past60Bars.reduce((sum, bar) => sum + bar.totalCents, 0);
  const actionSentence =
    actionCount === 1
      ? "so today's action comes from these buckets"
      : actionCount > 1
        ? `so today's ${actionCount} actions come from these buckets`
        : null;

  return (
    <WorkspaceCard className='p-4 md:p-5'>
      <h2 className='mb-4 text-sm font-semibold sm:text-base'>Outstanding by aging</h2>
      <div className='space-y-4 sm:space-y-3'>
        {bars.map((bar, index) => {
          const widthPct = Math.max((bar.totalCents / maxTotal) * 100, bar.totalCents > 0 ? 8 : 0);

          return (
            <div
              key={bar.bucket}
              className='grid gap-2 sm:grid-cols-[minmax(0,6.5rem)_1fr_auto] sm:items-center sm:gap-3 md:grid-cols-[minmax(0,7.5rem)_1fr_auto]'
            >
              <div className='flex items-center justify-between gap-2 sm:contents'>
                <span className='text-muted-foreground text-xs sm:text-sm'>{bar.label}</span>
                <span className='text-xs font-medium tabular-nums sm:hidden'>{bar.percent}%</span>
              </div>
              <div className='bg-muted/50 h-7 min-w-0 overflow-hidden rounded-md sm:h-8'>
                <motion.div
                  className={cn(
                    'flex h-full min-w-[2.5rem] items-center rounded-md px-2 text-[11px] font-medium text-white sm:min-w-[3rem] sm:px-2.5 sm:text-xs',
                    bucketBarStyles[bar.bucket]
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ ...springSoft, delay: index * 0.04 }}
                >
                  {bar.totalCents > 0 ? formatCurrency(bar.totalCents) : null}
                </motion.div>
              </div>
              <span className='hidden text-sm font-medium tabular-nums sm:block'>
                {bar.percent}%
              </span>
            </div>
          );
        })}
      </div>
      {past60 > 0 ? (
        <div className='bg-muted/40 mt-4 rounded-lg px-4 py-3'>
          <p className='text-sm leading-relaxed'>
            <span className='font-medium'>{formatCurrencyWhole(past60)} sits past 60 days.</span>{' '}
            That is where recovery odds decay fastest
            {actionSentence ? `, ${actionSentence}` : ''}. Overdue means action: follow up, call, or
            call the founder.
          </p>
        </div>
      ) : null}
    </WorkspaceCard>
  );
}
