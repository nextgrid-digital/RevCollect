'use client';

import { cn } from '@/lib/utils';
import { formatCurrencyWhole } from '../../utils';
import type { LastActionInsight } from '../../types';

interface InboxThreadActionBarProps {
  lastAction?: LastActionInsight;
  outstandingCents: number;
  suggestedAction?: string;
  hasAgentDraft?: boolean;
  onReviewDraft?: () => void;
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
  hasAgentDraft = false,
  onReviewDraft,
  className
}: InboxThreadActionBarProps) {
  const suggestedText = suggestedAction ?? 'Review thread and decide next step';

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
      <div className='min-w-0 flex-1'>
        <p className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>
          Suggested
        </p>
        <p className='mt-0.5 truncate text-xs font-medium' title={suggestedText}>
          {suggestedText}
        </p>
        {hasAgentDraft && onReviewDraft ? (
          <button
            type='button'
            onClick={onReviewDraft}
            className='text-primary mt-1 text-xs font-medium hover:underline'
          >
            Review draft →
          </button>
        ) : null}
      </div>
    </div>
  );
}
