'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { springSoft } from '@/features/revcollect/motion/motion-tokens';
import { formatCurrency } from '../../utils';
import type { AgingChartBucketRow, AgingReportBucket } from '../../types';

interface AgingBucketBarChartProps {
  buckets: AgingChartBucketRow[];
}

const bucketBarStyles: Record<AgingReportBucket, string> = {
  current: 'bg-emerald-500',
  '1-15': 'bg-amber-400',
  '16-30': 'bg-amber-500',
  '31-60': 'bg-orange-500',
  '60+': 'bg-red-600'
};

export function AgingBucketBarChart({ buckets }: AgingBucketBarChartProps) {
  const maxTotal = Math.max(...buckets.map((bucket) => bucket.totalCents), 1);

  return (
    <section className='min-w-0'>
      <h2 className='mb-4 text-sm font-semibold sm:text-base'>Outstanding by Aging Bucket</h2>
      <div className='space-y-4 sm:space-y-3'>
        {buckets.map((bucket, index) => {
          const widthPct = Math.max(
            (bucket.totalCents / maxTotal) * 100,
            bucket.totalCents > 0 ? 8 : 0
          );
          const invoiceLabel = `${bucket.invoiceCount} inv`;

          return (
            <div
              key={bucket.bucket}
              className='grid gap-2 sm:grid-cols-[minmax(0,6.5rem)_1fr_auto] sm:items-center sm:gap-3 md:grid-cols-[minmax(0,7.5rem)_1fr_auto]'
            >
              <div className='flex items-center justify-between gap-2 sm:contents'>
                <span className='text-muted-foreground text-xs sm:text-sm'>{bucket.label}</span>
                <span className='text-xs font-medium tabular-nums sm:hidden'>
                  {formatCurrency(bucket.totalCents)}
                </span>
              </div>
              <div className='bg-muted/50 h-7 min-w-0 overflow-hidden rounded-md sm:h-8'>
                <motion.div
                  className={cn(
                    'flex h-full min-w-[2.5rem] items-center rounded-md px-2 text-[11px] font-medium text-white sm:min-w-[3rem] sm:px-2.5 sm:text-xs',
                    bucketBarStyles[bucket.bucket]
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ ...springSoft, delay: index * 0.04 }}
                >
                  {bucket.invoiceCount > 0 ? invoiceLabel : null}
                </motion.div>
              </div>
              <span className='hidden text-sm font-medium tabular-nums sm:block'>
                {formatCurrency(bucket.totalCents)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
