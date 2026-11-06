'use client';

import { useMemo, type ReactNode } from 'react';
import { formatCurrencyWhole } from '../../utils';
import type {
  DashboardAttentionCard,
  DashboardOvernightPayments
} from '../lib/build-dashboard-snapshot';

interface DashboardGreetingProps {
  userName: string;
  overnightPayments: DashboardOvernightPayments | null;
  cards: DashboardAttentionCard[];
}

const SMALL_COUNT_WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine'
] as const;

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there';
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatAccountsWord(count: number): string {
  if (count >= 0 && count < SMALL_COUNT_WORDS.length) return SMALL_COUNT_WORDS[count];
  return String(count);
}

interface BriefPiece {
  id: string;
  text: string;
  render: (revealed: string) => ReactNode;
}

function SummaryEntityPill({ label }: { label: string }) {
  return (
    <span className='bg-background text-foreground mx-0.5 inline-flex translate-y-px items-center rounded-full px-2.5 py-0.5 text-[0.92em] font-semibold whitespace-nowrap'>
      {label}
    </span>
  );
}

function buildBriefPieces(cards: DashboardAttentionCard[]): BriefPiece[] {
  const count = cards.length;
  const accountsWord = formatAccountsWord(count);
  const accountsLead = count === 1 ? 'One account' : `${accountsWord} accounts`;
  const needVerb = count === 1 ? 'needs' : 'need';
  const pieces: BriefPiece[] = [
    {
      id: 'accounts-lead',
      text: accountsLead,
      render: (revealed) => (
        <strong className='font-semibold text-violet-950 dark:text-violet-50'>{revealed}</strong>
      )
    },
    {
      id: 'accounts-rest',
      text: ` still ${needVerb} attention today. `,
      render: (revealed) => revealed
    }
  ];

  cards.forEach((card, index) => {
    const pillLabel = `${card.company} (${formatCurrencyWhole(card.amountCents)})`;
    pieces.push({
      id: `${card.customerId}-pill`,
      text: pillLabel,
      render: (revealed) => <SummaryEntityPill label={revealed} />
    });
    pieces.push({
      id: `${card.customerId}-space`,
      text: ' ',
      render: (revealed) => revealed
    });
    const beat = card.digestBeat.trim();
    const needsStop = !/[.!?]"?$/.test(beat);
    pieces.push({
      id: `${card.customerId}-beat`,
      text: beat,
      render: (revealed) => revealed
    });
    pieces.push({
      id: `${card.customerId}-sep`,
      text: index < cards.length - 1 ? (needsStop ? '. ' : ' ') : needsStop ? '.' : '',
      render: (revealed) => revealed
    });
  });

  return pieces;
}

function GreetingBrief({ cards }: { cards: DashboardAttentionCard[] }) {
  const pieces = useMemo(() => buildBriefPieces(cards), [cards]);

  return (
    <div className='rounded-2xl bg-violet-100/90 px-4 py-3 text-sm leading-relaxed text-violet-950 dark:bg-violet-950/40 dark:text-violet-100'>
      {pieces.map((piece) => (
        <span key={piece.id}>{piece.render(piece.text)}</span>
      ))}
    </div>
  );
}

export function DashboardGreeting({ userName, overnightPayments, cards }: DashboardGreetingProps) {
  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const paymentCount = overnightPayments?.count ?? 0;
  const paymentsLead = paymentCount === 1 ? '1 payment' : `${paymentCount} payments`;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6'>
        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl' suppressHydrationWarning>
          {greeting}, {firstName(userName)}.
        </h1>
        <p className='text-muted-foreground shrink-0 text-xs' suppressHydrationWarning>
          {dateLabel}
        </p>
      </div>
      {overnightPayments && paymentCount > 0 ? (
        <div>
          <span className='inline-flex items-center rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1 text-sm font-medium whitespace-nowrap text-emerald-800 shadow-sm dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-300'>
            {paymentsLead} landed overnight · {formatCurrencyWhole(overnightPayments.amountCents)}
          </span>
        </div>
      ) : null}
      {(cards?.length ?? 0) > 0 ? <GreetingBrief cards={cards} /> : null}
    </div>
  );
}
