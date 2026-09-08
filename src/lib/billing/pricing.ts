export const TRIAL_DAYS = 30;

export const BASE_PRICE_MONTHLY_CENTS = 4900;
export const AGENT_PRICE_MONTHLY_CENTS = 3900;

/** Invoice-count tiers are not billed yet. */
export const PRICING_INVOICE_TIER_NOTE = 'unlimited until usage tiers ship';

export type CheckoutKind = 'base' | 'base_and_agent' | 'agent';
