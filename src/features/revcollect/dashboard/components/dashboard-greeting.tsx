'use client';

import { StatusBadge } from '@/features/revcollect/components/status-badge';
import { formatCurrencyWhole } from '../../utils';
import type { DashboardOvernightPayments } from '../lib/build-dashboard-snapshot';

interface DashboardGreetingProps {
  userName: string;
  overnightPayments: DashboardOvernightPayments | null;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there';
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardGreeting({ userName, overnightPayments }: DashboardGreetingProps) {
  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl' suppressHydrationWarning>
          {greeting}, {firstName(userName)}.
        </h1>
        <p className='text-muted-foreground shrink-0 text-sm' suppressHydrationWarning>
          {dateLabel}
        </p>
      </div>
      {overnightPayments ? (
        <StatusBadge
          label={
            overnightPayments.amountCents > 0
              ? `${overnightPayments.count} payment${overnightPayments.count === 1 ? '' : 's'} landed overnight — ${formatCurrencyWhole(overnightPayments.amountCents)}`
              : `${overnightPayments.count} payment${overnightPayments.count === 1 ? '' : 's'} landed overnight`
          }
          tone='success'
          rounded='full'
        />
      ) : null}
    </div>
  );
}
