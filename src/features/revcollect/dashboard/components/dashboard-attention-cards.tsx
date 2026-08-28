'use client';

import { WorkspaceCard } from '@/components/layout/workspace-card';
import { StatusBadge } from '@/features/revcollect/components/status-badge';
import { cn } from '@/lib/utils';
import { formatCurrencyWhole } from '../../utils';
import type { DashboardAttentionCard } from '../lib/build-dashboard-snapshot';

interface DashboardAttentionCardsProps {
  cards: DashboardAttentionCard[];
  onOpenThread: (messageId: string) => void;
}

export function DashboardAttentionCards({ cards, onOpenThread }: DashboardAttentionCardsProps) {
  if (cards.length === 0) {
    return <p className='text-muted-foreground text-sm'>Nothing needs attention today.</p>;
  }

  return (
    <section className='space-y-3'>
      <div>
        <h2 className='text-sm font-semibold sm:text-base'>Needs your attention today</h2>
        <p className='text-muted-foreground text-xs'>Ranked by cash impact</p>
      </div>
      <div className='grid gap-3 md:grid-cols-3'>
        {cards.map((card) => {
          const canOpen = Boolean(card.inboxMessageId);

          return (
            <button
              key={card.customerId}
              type='button'
              aria-label={
                canOpen ? `Open ${card.company} thread` : `${card.company} has no inbox thread`
              }
              aria-disabled={!canOpen}
              className={cn(
                'w-full appearance-none border-0 bg-transparent p-0 text-left',
                canOpen ? 'cursor-pointer' : 'cursor-default'
              )}
              onClick={() => {
                if (card.inboxMessageId) onOpenThread(card.inboxMessageId);
              }}
            >
              <WorkspaceCard
                className={cn(
                  'flex h-full flex-col p-4 md:p-5 transition-colors',
                  canOpen && 'hover:border-border hover:bg-muted/30'
                )}
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold'>{card.company}</p>
                  <StatusBadge label={card.statusLabel} tone={card.statusTone} className='mt-1.5' />
                </div>
                <p className='mt-4 text-2xl font-semibold tracking-tight tabular-nums'>
                  {formatCurrencyWhole(card.amountCents)}
                </p>
                <p className='text-muted-foreground text-xs'>{card.daysLabel}</p>
                <p className='text-muted-foreground mt-3 line-clamp-3 flex-1 text-sm leading-relaxed'>
                  {card.summary}
                </p>
                <div className='mt-4 flex flex-wrap gap-1.5'>
                  {card.actions.map((label, index) => (
                    <span
                      key={`${index}-${label}`}
                      className='bg-muted text-muted-foreground pointer-events-none rounded-full px-2.5 py-0.5 text-xs font-medium'
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </WorkspaceCard>
            </button>
          );
        })}
      </div>
    </section>
  );
}
