export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function dicebearAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}

/** Whole-dollar currency for tight metric cells (e.g. $41,200). */
export function formatCurrencyWhole(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(cents / 100);
}

export function getDaysOverdueFromDueDate(dueDate: string, asOf: Date = new Date()): number {
  const due = new Date(dueDate);
  const startOfAsOf = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffMs = startOfAsOf.getTime() - startOfDue.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatCompactCurrency(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(dollars % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (dollars >= 1_000) {
    return `$${Math.round(dollars / 1_000)}K`;
  }
  return formatCurrency(cents);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(iso));
}

/** Stable en-US datetime for tooltips — avoids SSR/client locale hydration mismatches. */
export function formatDateTimeTitle(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
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
  const date = new Date(iso);
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
  const date = new Date(iso);
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
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(iso);
}
