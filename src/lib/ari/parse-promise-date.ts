import { addDaysIsoDate, todayIsoDate } from '@/features/revcollect/lib/collection-decision';

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tues: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thurs: 4,
  thur: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6
};

const WEEKDAY_PATTERN =
  'sunday|sun|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat';
const NEXT_WEEKDAY_RE = new RegExp(`\\bnext\\s+(${WEEKDAY_PATTERN})\\b`);
const NAMED_WEEKDAY_RE = new RegExp(`\\b(?:this|by|on)\\s+(${WEEKDAY_PATTERN})\\b`);
const BARE_WEEKDAY_RE = new RegExp(`\\b(${WEEKDAY_PATTERN})\\b`);

function normalizeReplyText(text: string): string {
  return text
    .replace(/[\u00a0\u202f\u2007\u2009]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function daysUntilWeekday(now: Date, weekday: number, allowToday: boolean): number {
  const delta = (weekday - now.getDay() + 7) % 7;
  if (delta === 0) return allowToday ? 0 : 7;
  return delta;
}

function isoIfValid(iso: string, now: Date): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const today = todayIsoDate(now);
  const max = addDaysIsoDate(180, now);
  if (iso < today || iso > max) return null;
  return iso;
}

export function parsePromisedDateFromText(text: string, now = new Date()): string | null {
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch?.[1]) {
    return isoIfValid(isoMatch[1], now);
  }

  const normalized = normalizeReplyText(text);
  if (!normalized) return null;

  if (/\btomorrow\b/.test(normalized)) {
    return addDaysIsoDate(1, now);
  }

  if (/\bnext week\b/.test(normalized)) {
    return addDaysIsoDate(7, now);
  }

  if (/\bend of (the )?week\b|\beotw\b/.test(normalized)) {
    return addDaysIsoDate(daysUntilWeekday(now, 5, true), now);
  }

  const nextWeekday = normalized.match(NEXT_WEEKDAY_RE);
  const nextWeekdayIndex = nextWeekday?.[1] ? WEEKDAY_INDEX[nextWeekday[1]] : undefined;
  if (typeof nextWeekdayIndex === 'number') {
    return addDaysIsoDate(daysUntilWeekday(now, nextWeekdayIndex, false), now);
  }

  const namedWeekday = normalized.match(NAMED_WEEKDAY_RE);
  const namedWeekdayIndex = namedWeekday?.[1] ? WEEKDAY_INDEX[namedWeekday[1]] : undefined;
  if (typeof namedWeekdayIndex === 'number') {
    const allowToday = (namedWeekday?.[0] ?? '').startsWith('this ');
    return addDaysIsoDate(daysUntilWeekday(now, namedWeekdayIndex, allowToday), now);
  }

  const bareWeekday = normalized.match(BARE_WEEKDAY_RE);
  const bareWeekdayIndex = bareWeekday?.[1] ? WEEKDAY_INDEX[bareWeekday[1]] : undefined;
  if (
    typeof bareWeekdayIndex === 'number' &&
    /\b(pay|paid|promise|send|transfer)\b/.test(normalized)
  ) {
    return addDaysIsoDate(daysUntilWeekday(now, bareWeekdayIndex, false), now);
  }

  return null;
}
