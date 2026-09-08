import { getAuthUser, getAuthUserId } from '@/lib/supabase/get-auth-user';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { AgentAddonSubscribeResult } from '@/features/revcollect/types';
import { getWorkspaceEntitlements } from './entitlements';
import {
  AGENT_PRICE_MONTHLY_CENTS,
  ESTIMATED_AI_COST_MONTHLY_CENTS,
  type CheckoutKind
} from './pricing';
import {
  getAgentAddonPriceId,
  getAppUrl,
  getBasePriceId,
  getStripe,
  isStripeBillingConfigured
} from './stripe';
import { persistStripeCustomerId } from './tenant-billing';

export class StripeBillingNotConfiguredError extends Error {
  constructor() {
    super('Stripe billing is not configured.');
    this.name = 'StripeBillingNotConfiguredError';
  }
}

export async function startCheckout(kind: CheckoutKind): Promise<AgentAddonSubscribeResult> {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error('Sign in to subscribe.');
  }

  if (!isStripeBillingConfigured()) {
    throw new StripeBillingNotConfiguredError();
  }

  const basePriceId = getBasePriceId();
  const agentPriceId = getAgentAddonPriceId();
  if (!basePriceId) {
    throw new StripeBillingNotConfiguredError();
  }

  const entitlements = await getWorkspaceEntitlements();
  if (entitlements.comped) {
    return {
      subscribed: true,
      priceMonthlyCents: AGENT_PRICE_MONTHLY_CENTS,
      estimatedAiCostMonthlyCents: ESTIMATED_AI_COST_MONTHLY_CENTS,
      stripeCustomerId: entitlements.stripeCustomerId,
      hasBase: true,
      inTrial: false,
      canWrite: true,
      canRunAgent: true,
      comped: true
    };
  }

  let resolvedKind: CheckoutKind = kind;
  if (resolvedKind === 'agent' && !entitlements.hasBase && !entitlements.inTrial) {
    resolvedKind = 'base_and_agent';
  }

  if (resolvedKind === 'base' && entitlements.hasBase && !entitlements.inTrial) {
    return {
      subscribed: entitlements.canRunAgent,
      priceMonthlyCents: AGENT_PRICE_MONTHLY_CENTS,
      estimatedAiCostMonthlyCents: ESTIMATED_AI_COST_MONTHLY_CENTS,
      stripeCustomerId: entitlements.stripeCustomerId,
      hasBase: entitlements.hasBase,
      inTrial: entitlements.inTrial,
      canWrite: entitlements.canWrite,
      canRunAgent: entitlements.canRunAgent
    };
  }

  if (resolvedKind === 'agent' && entitlements.canRunAgent && !entitlements.inTrial) {
    return {
      subscribed: true,
      priceMonthlyCents: AGENT_PRICE_MONTHLY_CENTS,
      estimatedAiCostMonthlyCents: ESTIMATED_AI_COST_MONTHLY_CENTS,
      stripeCustomerId: entitlements.stripeCustomerId,
      hasBase: entitlements.hasBase,
      canRunAgent: true
    };
  }

  const lineItems: Array<{ price: string; quantity: number }> = [];
  if (resolvedKind === 'base' || resolvedKind === 'base_and_agent') {
    lineItems.push({ price: basePriceId, quantity: 1 });
  }
  if (resolvedKind === 'agent' || resolvedKind === 'base_and_agent') {
    if (!agentPriceId) {
      throw new StripeBillingNotConfiguredError();
    }
    lineItems.push({ price: agentPriceId, quantity: 1 });
  }

  const stripe = getStripe();
  const user = await getAuthUser();
  const tenantId = await getIntegrationTenantId();
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  let customerId = snapshot.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: user.name || undefined,
      metadata: { tenantId }
    });
    customerId = customer.id;
    await persistStripeCustomerId(tenantId, customerId);
  }

  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: lineItems,
    success_url: `${appUrl}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/settings/billing?checkout=cancel`,
    allow_promotion_codes: true,
    metadata: { tenantId, kind: resolvedKind },
    subscription_data: {
      metadata: { tenantId }
    }
  });

  if (!session.url) {
    throw new Error('Stripe did not return a Checkout URL.');
  }

  return {
    subscribed: entitlements.canRunAgent,
    priceMonthlyCents: AGENT_PRICE_MONTHLY_CENTS,
    estimatedAiCostMonthlyCents: ESTIMATED_AI_COST_MONTHLY_CENTS,
    stripeCustomerId: customerId,
    checkoutUrl: session.url,
    hasBase: entitlements.hasBase,
    inTrial: entitlements.inTrial,
    canWrite: entitlements.canWrite,
    canRunAgent: entitlements.canRunAgent
  };
}

export async function startAgentAddonCheckout(): Promise<AgentAddonSubscribeResult> {
  const entitlements = await getWorkspaceEntitlements();
  if (entitlements.hasBase || entitlements.inTrial) {
    return startCheckout('agent');
  }
  return startCheckout('base_and_agent');
}

export async function createBillingPortalUrl(): Promise<string> {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error('Sign in to manage billing.');
  }
  if (!isStripeBillingConfigured()) {
    throw new StripeBillingNotConfiguredError();
  }

  const tenantId = await getIntegrationTenantId();
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const customerId = snapshot.stripeCustomerId;
  if (!customerId) {
    throw new Error('No Stripe customer for this workspace. Subscribe first.');
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/settings/billing`
  });
  return session.url;
}
