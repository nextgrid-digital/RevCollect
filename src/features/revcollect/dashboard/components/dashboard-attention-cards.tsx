'use client';

import { Icons } from '@/components/icons';
import {
  InboxListPill,
  type InboxListPillVariant
} from '@/features/revcollect/inbox/lib/inbox-list-badges';
import { cn } from '@/lib/utils';
import { formatCurrencyWhole } from '../../utils';
import type { StatusBadgeTone } from '../../components/status-badge';
import type { DashboardAttentionCard } from '../lib/build-dashboard-snapshot';

interface DashboardAttentionCardsProps {
  cards: DashboardAttentionCard[];
  onOpenThread: (messageId: string) => void;
}

function reasonPillVariant(tone: StatusBadgeTone): InboxListPillVariant {
  if (tone === 'danger') return 'overdue';
  if (tone === 'warning') return 'attention';
  if (tone === 'violet') return 'ai_draft';
  return 'monitoring';
}

function AttentionCard({
  card,
  onOpenThread
}: {
  card: DashboardAttentionCard;
  onOpenThread: (messageId: string) => void;
}) {
  const messageId = card.inboxMessageId;
  const className = cn(
    'bg-card border-border/60 flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border text-left',
    messageId &&
      'hover:bg-muted/40 focus-visible:ring-ring cursor-pointer transition-colors hover:border-border focus-visible:ring-2 focus-visible:outline-none'
  );
  const body = (
    <div className='flex h-full min-h-0 flex-1 flex-col gap-3 p-4'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 space-y-1.5'>
          <h3 className='text-sm leading-snug font-semibold'>{card.company}</h3>
          <InboxListPill label={card.statusLabel} variant={reasonPillVariant(card.statusTone)} />
        </div>
        {messageId ? (
          <Icons.arrowUpRight
            className='text-muted-foreground mt-0.5 size-4 shrink-0'
            aria-hidden
          />
        ) : null}
      </div>
      <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
        <span className='text-2xl font-semibold tracking-tight tabular-nums'>
          {formatCurrencyWhole(card.amountCents)}
        </span>
        <span className='text-muted-foreground text-xs'>{card.daysLabel}</span>
      </div>
      <p className='bg-muted/50 text-muted-foreground mt-auto rounded-lg px-3 py-2.5 text-xs leading-relaxed'>
        {card.summary}
      </p>
      {card.actions.length > 0 ? (
        <div className='flex flex-wrap items-center justify-end gap-1.5'>
          {card.actions.map((label) =>
            messageId ? (
              <button
                key={label}
                type='button'
                className='text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 items-center gap-1 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none'
                aria-label={`Open ${card.company} thread`}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenThread(messageId);
                }}
              >
                {label.toLowerCase().startsWith('call') ? <Icons.phone className='size-3' /> : null}
                {label}
              </button>
            ) : (
              <span
                key={label}
                className='text-muted-foreground inline-flex shrink-0 items-center gap-1 text-[11px] font-medium'
              >
                {label.toLowerCase().startsWith('call') ? <Icons.phone className='size-3' /> : null}
                {label}
              </span>
            )
          )}
        </div>
      ) : null}
    </div>
  );

  if (!messageId) {
    return (
      <div className={className} aria-label={`${card.company} has no inbox thread`}>
        {body}
      </div>
    );
  }

  return (
    <div
      className={className}
      aria-label={`Open ${card.company} thread`}
      onClick={() => onOpenThread(messageId)}
      role='button'
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenThread(messageId);
        }
      }}
    >
      {body}
    </div>
  );
}

export function DashboardAttentionCards({ cards, onOpenThread }: DashboardAttentionCardsProps) {
  if (cards.length === 0) {
    return <p className='text-muted-foreground text-sm'>Nothing needs attention today.</p>;
  }

  return (
    <section className='border-border/60 mt-4 space-y-3 border-t pt-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6'>
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          <h2 className='text-base font-semibold tracking-tight'>Needs your attention today</h2>
          <span className='inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-900 dark:bg-orange-950/50 dark:text-orange-200'>
            {cards.length === 1 ? '1 account' : `${cards.length} accounts`}
          </span>
        </div>
        <p className='text-muted-foreground shrink-0 text-xs leading-snug sm:text-right'>
          Ranked by cash impact
        </p>
      </div>
      <ul className='grid grid-cols-1 gap-3 md:grid-cols-3'>
        {cards.map((card) => (
          <li key={card.customerId} className='flex min-w-0'>
            <AttentionCard card={card} onOpenThread={onOpenThread} />
          </li>
        ))}
      </ul>
    </section>
  );
}
