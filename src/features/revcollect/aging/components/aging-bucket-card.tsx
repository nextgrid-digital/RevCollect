'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '../../utils';
import type { AgingBucket, AgingBucketSummary } from '../../types';

interface AgingBucketCardProps {
  bucket: AgingBucketSummary;
  selected: boolean;
  onSelect: () => void;
}

type BucketStyle = {
  border: string;
  surface: string;
  selectedSurface: string;
  ring: string;
  badge: string;
};

const bucketStyles: Record<AgingBucket, BucketStyle> = {
  current: {
    border: 'border-emerald-500/30',
    surface: 'from-emerald-500/8 to-card',
    selectedSurface: 'from-emerald-500/14 to-emerald-500/5',
    ring: 'ring-emerald-500/25',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
  },
  '1-30': {
    border: 'border-amber-500/30',
    surface: 'from-amber-500/8 to-card',
    selectedSurface: 'from-amber-500/14 to-amber-500/5',
    ring: 'ring-amber-500/25',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
  },
  '31-60': {
    border: 'border-orange-500/30',
    surface: 'from-orange-500/8 to-card',
    selectedSurface: 'from-orange-500/14 to-orange-500/5',
    ring: 'ring-orange-500/25',
    badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
  },
  '61-90': {
    border: 'border-red-500/30',
    surface: 'from-red-500/8 to-card',
    selectedSurface: 'from-red-500/14 to-red-500/5',
    ring: 'ring-red-500/25',
    badge: 'bg-red-500/10 text-red-700 dark:text-red-400'
  },
  '90+': {
    border: 'border-rose-500/30',
    surface: 'from-rose-500/8 to-card',
    selectedSurface: 'from-rose-500/14 to-rose-500/5',
    ring: 'ring-rose-500/25',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
  }
};

export function AgingBucketCard({ bucket, selected, onSelect }: AgingBucketCardProps) {
  const styles = bucketStyles[bucket.bucket];
  const invoiceLabel = `${bucket.invoiceCount} invoice${bucket.invoiceCount === 1 ? '' : 's'}`;

  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative flex w-full flex-col rounded-xl border p-4 text-left transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        selected
          ? cn(
              'bg-gradient-to-br shadow-sm ring-2',
              styles.border,
              styles.selectedSurface,
              styles.ring
            )
          : cn('bg-gradient-to-br border-border/70 hover:border-border', styles.surface)
      )}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-sm font-medium'>{bucket.label}</p>
          <p className='mt-2 text-2xl font-semibold tracking-tight tabular-nums'>
            {formatCurrency(bucket.totalCents)}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums',
            styles.badge
          )}
        >
          {invoiceLabel}
        </span>
      </div>
    </button>
  );
}
