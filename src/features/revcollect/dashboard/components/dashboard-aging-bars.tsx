'use client';

import { motion } from 'motion/react';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { springSoft } from '@/features/revcollect/motion/motion-tokens';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../../utils';
import type { AgingBucket } from '../../types';
import type { DashboardAgingBar } from '../lib/build-dashboard-snapshot';

const bucketBarStyles: Record<AgingBucket, string> = {
  current: 'bg-emerald-500',
  '1-30': 'bg-violet-500',
  '31-60': 'bg-amber-400',
  '61-90': 'bg-orange-500',
  '90+': 'bg-red-500'
};

const bucketAmountStyles: Record<AgingBucket, string> = {
  current: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  '1-30': 'bg-violet-500/15 text-violet-800 dark:text-violet-300',
  '31-60': 'bg-amber-400/20 text-amber-900 dark:text-amber-300',
  '61-90': 'bg-orange-500/15 text-orange-800 dark:text-orange-300',
  '90+': 'bg-red-500/15 text-red-800 dark:text-red-300'
};

interface DashboardAgingBarsProps {
  bars: DashboardAgingBar[];
}

export function DashboardAgingBars({ bars }: DashboardAgingBarsProps) {
  const maxTotal = Math.max(...bars.map((bar) => bar.totalCents), 1);
  const past60Bars = bars.filter((bar) => bar.bucket === '61-90' || bar.bucket === '90+');
  const past60 = past60Bars.reduce((sum, bar) => sum + bar.totalCents, 0);
  const past60Pct = past60Bars.reduce((sum, bar) => sum + bar.percent, 0);

  return (
    <WorkspaceCard className='p-4 md:p-5'>
      <h2 className='mb-4 text-sm font-semibold sm:text-base'>Outstanding by aging</h2>
      <div className='space-y-3'>
        {bars.map((bar, index) => {
          const widthPct = Math.max((bar.totalCents / maxTotal) * 100, bar.totalCents > 0 ? 10 : 0);

          return (
            <div
              key={bar.bucket}
              className='grid gap-2 sm:grid-cols-[minmax(0,7rem)_auto_1fr_auto] sm:items-center sm:gap-3'
            >
              <span className='text-muted-foreground text-xs sm:text-sm'>{bar.label}</span>
              <span
                className={cn(
                  'inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-medium tabular-nums',
                  bucketAmountStyles[bar.bucket]
                )}
              >
                {formatCurrency(bar.totalCents)}
              </span>
              <div className='bg-muted/50 h-2.5 min-w-0 overflow-hidden rounded-full'>
                <motion.div
                  className={cn('h-full rounded-full', bucketBarStyles[bar.bucket])}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ ...springSoft, delay: index * 0.04 }}
                />
              </div>
              <span className='text-muted-foreground w-10 text-right text-xs tabular-nums'>
                {bar.percent}%
              </span>
            </div>
          );
        })}
      </div>
      {past60 > 0 ? (
        <p className='bg-muted/60 mt-4 rounded-lg px-3 py-2 text-xs leading-relaxed'>
          Recovery odds decay fastest after 60 days — {past60Pct}% of AR ({formatCurrency(past60)})
          sits in that window.
        </p>
      ) : null}
    </WorkspaceCard>
  );
}
