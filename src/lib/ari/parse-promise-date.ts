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

const MONTH_INDEX: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sept: 8,
  sep: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11
};

const WEEKDAY_PATTERN =
  'sunday|sun|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat';
const MONTH_PATTERN =
  'january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec';

/** "Friday next week", "next week Friday", "next week's Friday" */
const WEEKDAY_NEXT_WEEK_RE = new RegExp(
  `\\b(${WEEKDAY_PATTERN})\\s+next\\s+week(?:['’]s)?\\b|\\bnext\\s+week(?:['’]s)?\\s+(${WEEKDAY_PATTERN})\\b`
);
const NEXT_WEEKDAY_RE = new RegExp(`\\bnext\\s+(${WEEKDAY_PATTERN})\\b`);
const NAMED_WEEKDAY_RE = new RegExp(`\\b(?:this|by|on)\\s+(${WEEKDAY_PATTERN})\\b`);
const BARE_WEEKDAY_RE = new RegExp(`\\b(${WEEKDAY_PATTERN})\\b`);
/** Oct 24, October 24th, 24 Oct, 24th of October */
const MONTH_DAY_RE = new RegExp(
  `\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b|\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_PATTERN})\\b`,
  'i'
);

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

/** Weekday occurring in the calendar week after the current one. */
function daysUntilWeekdayNextWeek(now: Date, weekday: number): number {
  return daysUntilWeekday(now, weekday, true) + 7;
}

function isoIfValid(iso: string, now: Date): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const today = todayIsoDate(now);
  const max = addDaysIsoDate(180, now);
  if (iso < today || iso > max) return null;
  return iso;
}

function parseMonthDayIso(text: string, now: Date): string | null {
  const match = text.match(MONTH_DAY_RE);
  if (!match) return null;

  const monthToken = (match[1] ?? match[4] ?? '').toLowerCase();
  const dayToken = match[2] ?? match[3];
  const month = MONTH_INDEX[monthToken];
  const day = Number(dayToken);
  if (typeof month !== 'number' || !Number.isFinite(day) || day < 1 || day > 31) return null;

  const year = now.getFullYear();
  const candidate = new Date(year, month, day);
  if (candidate.getMonth() !== month || candidate.getDate() !== day) return null;

  let iso = todayIsoDate(candidate);
  if (iso < todayIsoDate(now)) {
    const nextYear = new Date(year + 1, month, day);
    iso = todayIsoDate(nextYear);
  }
  return isoIfValid(iso, now);
}

export function parsePromisedDateFromText(text: string, now = new Date()): string | null {
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch?.[1]) {
    return isoIfValid(isoMatch[1], now);
  }

  const monthDay = parseMonthDayIso(text, now);
  if (monthDay) return monthDay;

  const normalized = normalizeReplyText(text);
  if (!normalized) return null;

  if (/\btomorrow\b/.test(normalized)) {
    return addDaysIsoDate(1, now);
  }

  // "Friday next week" / "next week Friday" — before bare "next week"
  const weekdayNextWeek = normalized.match(WEEKDAY_NEXT_WEEK_RE);
  const weekdayNextWeekToken = weekdayNextWeek?.[1] ?? weekdayNextWeek?.[2];
  const weekdayNextWeekIndex = weekdayNextWeekToken
    ? WEEKDAY_INDEX[weekdayNextWeekToken]
    : undefined;
  if (typeof weekdayNextWeekIndex === 'number') {
    return addDaysIsoDate(daysUntilWeekdayNextWeek(now, weekdayNextWeekIndex), now);
  }

  // Bare "next week" only when no weekday is named in the reply
  if (
    /\bnext week\b/.test(normalized) &&
    !new RegExp(`\\b(${WEEKDAY_PATTERN})\\b`).test(normalized)
  ) {
    return addDaysIsoDate(7, now);
  }

  if (/\bend of (the )?week\b|\beotw\b/.test(normalized)) {
    return addDaysIsoDate(daysUntilWeekday(now, 5, true), now);
  }

  const nextWeekday = normalized.match(NEXT_WEEKDAY_RE);
  const nextWeekdayIndex = nextWeekday?.[1] ? WEEKDAY_INDEX[nextWeekday[1]] : undefined;
  if (typeof nextWeekdayIndex === 'number') {
    // "next Friday" = the forthcoming Friday (not today). On Thu that is tomorrow.
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
