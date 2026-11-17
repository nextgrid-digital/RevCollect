export function formatCurrency(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(cents / 100);
}

/** Whole-dollar currency for tight metric cells (e.g. $41,200). */
export function formatCurrencyWhole(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(cents / 100);
}

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.\d+)?Z)?$/;

function calendarDateParts(iso: string): { year: number; month: number; day: number } | null {
  const match = CALENDAR_DATE.exec(iso.trim());
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function dateFromIso(iso: string): Date {
  const parts = calendarDateParts(iso);
  if (parts) return new Date(parts.year, parts.month - 1, parts.day);
  return new Date(iso);
}

export function getDaysOverdueFromDueDate(dueDate: string, asOf: Date = new Date()): number {
  const due = dateFromIso(dueDate);
  const startOfAsOf = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffMs = startOfAsOf.getTime() - startOfDue.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/** Signed whole days from `fromDate` to `toDate` (YYYY-MM-DD). */
export function calendarDaysBetween(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate.slice(0, 10)}T00:00:00`);
  const to = new Date(`${toDate.slice(0, 10)}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatCompactCurrency(cents: number, currency = 'USD'): string {
  const dollars = cents / 100;
  if (currency === 'USD') {
    if (dollars >= 1_000_000) {
      return `$${(dollars / 1_000_000).toFixed(dollars % 1_000_000 === 0 ? 0 : 1)}M`;
    }
    if (dollars >= 1_000) {
      return `$${Math.round(dollars / 1_000)}K`;
    }
  }
  return formatCurrency(cents, currency);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateFromIso(iso));
}

/** Stable en-US datetime for tooltips — avoids SSR/client locale hydration mismatches. */
export function formatDateTimeTitle(iso: string | Date): string {
  if (typeof iso === 'string' && calendarDateParts(iso)) return formatDate(iso);
  const date = typeof iso === 'string' ? dateFromIso(iso) : iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

/** Compact activity time for inbox rail — stable en-US to avoid hydration mismatches. */
export function formatInboxActivityTime(iso: string): string {
  if (calendarDateParts(iso)) return formatDate(iso);
  const date = dateFromIso(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEvent = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfEvent.getTime()) / (1000 * 60 * 60 * 24)
  );

  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);

  if (diffDays === 0) return `Today ${time}`;
  if (diffDays === 1) return `Yesterday ${time}`;
  return `${formatDate(iso)} ${time}`;
}

export function formatInboxListTimestamp(iso: string): string {
  if (calendarDateParts(iso)) return formatDate(iso);
  const date = dateFromIso(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEvent = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfEvent.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export function formatRelativeDate(iso: string): string {
  const date = dateFromIso(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(iso);
}

/** Sync older than this is treated as stale in the header pill. */
export const SYNC_STALE_AFTER_MS = 24 * 60 * 60 * 1000;
/** Sync older than this is treated as critically stale. */
export const SYNC_CRITICAL_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export function syncAgeMs(iso: string, nowMs: number = Date.now()): number {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return Math.max(0, nowMs - date.getTime());
}

export type SyncFreshness = 'fresh' | 'stale' | 'critical';

export function syncFreshness(iso: string, nowMs: number = Date.now()): SyncFreshness {
  const age = syncAgeMs(iso, nowMs);
  if (age >= SYNC_CRITICAL_AFTER_MS) return 'critical';
  if (age >= SYNC_STALE_AFTER_MS) return 'stale';
  return 'fresh';
}

export function formatLastSyncLabel(iso: string, nowMs: number = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const diffMs = nowMs - date.getTime();
  if (diffMs < 45_000) return 'just now';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}
