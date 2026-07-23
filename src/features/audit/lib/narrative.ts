import type { CustomerBehavior } from './types';

export function buildBehaviorRead(customer: CustomerBehavior): string {
  const { behaviorBand, deteriorating } = customer;
  const suffix = deteriorating ? ' · DETERIORATING' : '';

  switch (behaviorBand) {
    case 'Reliable':
      return `Reliable${suffix}`;
    case 'Mildly slow':
      return `Mildly slow${suffix}`;
    case 'Chronically slow':
      return `Chronically slow${suffix}`;
    case 'Problem payer':
      return `Problem payer${suffix}`;
    default: {
      const _exhaustive: never = behaviorBand;
      return _exhaustive;
    }
  }
}

export function buildFirstMove(customer: CustomerBehavior): string {
  const late = Math.round(customer.avgDaysLate ?? 0);
  const age = Math.round(customer.valueWeightedAge);
  const has90 = customer.aging['90+'] > 0;
  const multiOpen = customer.openInvoiceCount >= 3;
  const singleOpen = customer.openInvoiceCount === 1;

  if (customer.deteriorating && (customer.lateTrendDays ?? 0) >= 8) {
    return `Deteriorating fast (+${Math.round(customer.lateTrendDays ?? 0)}d): a relationship call this week to find the cause.`;
  }

  if (customer.behaviorBand === 'Reliable') {
    return 'Reliable: gentle nudge only, protect the relationship.';
  }

  if (has90 && multiOpen) {
    return 'Dated final notice on the 90+ item; confirm retainage release milestones in writing.';
  }

  if (has90) {
    return 'Dated final notice on the 90+ item; confirm retainage release milestones in writing.';
  }

  if (multiOpen && late >= 30) {
    return 'One account-level call; consolidate all open items into a written plan (they honor plans).';
  }

  if (late >= 50) {
    return `Chronic ${late}-day payer: firm ladder now; move to prepay or tightened terms at renewal.`;
  }

  if (late >= 30) {
    return 'Broken-promise pattern: quote their last commitment; require a dated schedule.';
  }

  if (singleOpen && age <= 0) {
    return 'Single large invoice: a direct AP status call; likely approval cycle, not refusal.';
  }

  if (late >= 40) {
    return 'Fixed-cycle payer: align invoicing to their run cutoff; chase the cycle, not the person.';
  }

  if (customer.behaviorBand === 'Chronically slow') {
    return 'Standard ladder; if a new PO arrives, trade clearing for shipping.';
  }

  if (age > 0 && age < 15) {
    return 'Verify milestone sign-off; isolate any disputed line, collect the clean balance now.';
  }

  return 'Standard follow-up ladder; keep promises on a dated tracker.';
}

export function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatDays(value: number | null, digits = 0): string {
  if (value === null || Number.isNaN(value)) return 'n/a';
  if (digits === 0) return `${Math.round(value)}d`;
  return `${value.toFixed(digits)}d`;
}

export function formatTrend(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}`;
}
