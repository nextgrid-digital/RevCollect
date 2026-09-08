import { DEFAULT_ADDON_STATUS } from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';
import { createAdminClient, hasSupabaseAdminEnv } from '@/lib/supabase/admin';
import type { AgentAddonStatus } from '@/features/revcollect/types';
import type { BillingSubscriptionStatus } from './subscription-status';
import { isAddonSubscribed, mapStripeSubscriptionStatus } from './subscription-status';
import { getAgentAddonPriceId, getBasePriceId } from './stripe';

export interface TenantBilling {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  baseSubscribed: boolean;
  agentSubscribed: boolean;
  subscriptionStatus: BillingSubscriptionStatus;
}

export function addonStatusFromBilling(billing: TenantBilling | null): AgentAddonStatus {
  return {
    ...DEFAULT_ADDON_STATUS,
    subscribed: billing?.agentSubscribed ?? false,
    stripeCustomerId: billing?.stripeCustomerId ?? null
  };
}

export async function findTenantIdByStripeCustomer(
  stripeCustomerId: string
): Promise<string | null> {
  if (!hasSupabaseAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  if (error) {
    console.error('[billing] find tenant by stripe customer failed:', error.message);
    return null;
  }
  return (data as { id?: string } | null)?.id ?? null;
}

export async function persistTenantBilling(
  tenantId: string,
  billing: TenantBilling
): Promise<void> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  snapshot.stripeCustomerId = billing.stripeCustomerId;
  snapshot.stripeSubscriptionId = billing.stripeSubscriptionId;
  snapshot.baseSubscribed = billing.baseSubscribed;
  snapshot.agentAddonStatus = {
    ...(snapshot.agentAddonStatus ?? DEFAULT_ADDON_STATUS),
    subscribed: billing.agentSubscribed,
    stripeCustomerId: billing.stripeCustomerId
  };
  await store.write(tenantId, snapshot);
}

export async function persistStripeCustomerId(
  tenantId: string,
  stripeCustomerId: string
): Promise<void> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  snapshot.stripeCustomerId = stripeCustomerId;
  snapshot.agentAddonStatus = {
    ...(snapshot.agentAddonStatus ?? DEFAULT_ADDON_STATUS),
    stripeCustomerId
  };
  await store.write(tenantId, snapshot);
}

export function billingFromPriceIds(input: {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripeStatus: string | null;
  priceIds: string[];
}): TenantBilling {
  const paid = isAddonSubscribed(input.stripeStatus);
  const basePriceId = getBasePriceId();
  const agentPriceId = getAgentAddonPriceId();
  const priceSet = new Set(input.priceIds);
  const hasBasePrice = basePriceId ? priceSet.has(basePriceId) : false;
  const hasAgentPrice = agentPriceId ? priceSet.has(agentPriceId) : false;

  return {
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    baseSubscribed: paid && (hasBasePrice || (!basePriceId && paid)),
    agentSubscribed: paid && hasAgentPrice,
    subscriptionStatus: mapStripeSubscriptionStatus(input.stripeStatus)
  };
}
