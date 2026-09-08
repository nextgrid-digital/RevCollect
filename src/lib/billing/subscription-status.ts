export type BillingSubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'past_due';

const SUBSCRIBED_STRIPE_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function isAddonSubscribed(stripeStatus: string | null | undefined): boolean {
  if (!stripeStatus) return false;
  return SUBSCRIBED_STRIPE_STATUSES.has(stripeStatus);
}

export function mapStripeSubscriptionStatus(
  stripeStatus: string | null | undefined
): BillingSubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'cancelled';
    default:
      return 'cancelled';
  }
}
