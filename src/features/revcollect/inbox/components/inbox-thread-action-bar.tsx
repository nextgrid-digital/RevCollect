'use client';

import { cn } from '@/lib/utils';
import { formatCurrencyWhole } from '../../utils';
import type { LastActionInsight } from '../../types';

interface InboxThreadActionBarProps {
  lastAction?: LastActionInsight;
  outstandingCents: number;
  suggestedAction?: string;
  className?: string;
}

function InsightCell({
  label,
  value,
  valueClassName
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className='min-w-0 flex-1'>
      <p className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>
        {label}
      </p>
      <p className={cn('mt-0.5 truncate text-xs font-medium', valueClassName)} title={value}>
        {value}
      </p>
    </div>
  );
}

export function InboxThreadActionBar({
  lastAction,
  outstandingCents,
  suggestedAction,
  className
}: InboxThreadActionBarProps) {
  return (
    <div
      className={cn(
        'border-border/60 bg-muted/30 grid grid-cols-1 gap-3 border-b px-4 py-2.5 sm:grid-cols-3 md:pr-5',
        className
      )}
    >
      <InsightCell
        label='Last action'
        value={
          lastAction ? `${lastAction.title} · ${lastAction.occurredAtLabel}` : 'No prior action'
        }
      />
      <InsightCell
        label='Outstanding'
        value={formatCurrencyWhole(outstandingCents)}
        valueClassName='text-rose-700 dark:text-rose-400 tabular-nums'
      />
      <InsightCell
        label='Suggested'
        value={suggestedAction ?? 'Review thread and decide next step'}
      />
    </div>
  );
}
