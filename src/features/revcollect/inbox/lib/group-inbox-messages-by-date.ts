import type { InboxMessage } from '../../types';

export interface InboxMessageDateGroup {
  id: string;
  /** null = no section header (today only, Notion-style) */
  label: string | null;
  messages: InboxMessage[];
}

type RelativeGroupId = 'today' | 'last_7_days' | 'last_30_days';

interface MonthBucket {
  year: number;
  month: number;
  messages: InboxMessage[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffCalendarDays(receivedAt: string, now: Date): number {
  const eventDay = startOfDay(new Date(receivedAt));
  const today = startOfDay(now);
  return Math.floor((today.getTime() - eventDay.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMonthLabel(year: number, month: number, now: Date): string {
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    new Date(year, month, 1)
  );
  if (year !== now.getFullYear()) {
    return `${monthName} ${year}`;
  }
  return monthName;
}

function monthKey(year: number, month: number): string {
  return `month:${year}-${month}`;
}

export function groupInboxMessagesByDate(
  messages: InboxMessage[],
  now: Date = new Date()
): InboxMessageDateGroup[] {
  const relativeBuckets: Record<RelativeGroupId, InboxMessage[]> = {
    today: [],
    last_7_days: [],
    last_30_days: []
  };
  const monthBuckets = new Map<string, MonthBucket>();

  for (const message of messages) {
    const diffDays = diffCalendarDays(message.receivedAt, now);

    if (diffDays === 0) {
      relativeBuckets.today.push(message);
      continue;
    }

    if (diffDays <= 7) {
      relativeBuckets.last_7_days.push(message);
      continue;
    }

    if (diffDays <= 30) {
      relativeBuckets.last_30_days.push(message);
      continue;
    }

    const date = new Date(message.receivedAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = monthKey(year, month);
    const existing = monthBuckets.get(key);

    if (existing) {
      existing.messages.push(message);
    } else {
      monthBuckets.set(key, { year, month, messages: [message] });
    }
  }

  const groups: InboxMessageDateGroup[] = [];

  if (relativeBuckets.today.length > 0) {
    groups.push({ id: 'today', label: null, messages: relativeBuckets.today });
  }

  if (relativeBuckets.last_7_days.length > 0) {
    groups.push({
      id: 'last_7_days',
      label: 'Last 7 days',
      messages: relativeBuckets.last_7_days
    });
  }

  if (relativeBuckets.last_30_days.length > 0) {
    groups.push({
      id: 'last_30_days',
      label: 'Last 30 days',
      messages: relativeBuckets.last_30_days
    });
  }

  const sortedMonths = [...monthBuckets.values()].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  for (const bucket of sortedMonths) {
    groups.push({
      id: monthKey(bucket.year, bucket.month),
      label: formatMonthLabel(bucket.year, bucket.month, now),
      messages: bucket.messages
    });
  }

  return groups;
}
