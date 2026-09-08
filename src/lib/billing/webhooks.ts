import type Stripe from 'stripe';
import { getStripe } from './stripe';
import {
  billingFromPriceIds,
  findTenantIdByStripeCustomer,
  persistTenantBilling,
  type TenantBilling
} from './tenant-billing';
import { isAddonSubscribed } from './subscription-status';

function customerIdFrom(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

function priceIdsFromSubscription(subscription: Stripe.Subscription): string[] {
  return subscription.items.data.map((item) => item.price.id);
}

async function resolveTenantId(
  metadata: Stripe.Metadata | null | undefined,
  customerId: string | null
): Promise<string | null> {
  const fromMeta = metadata?.tenantId?.trim();
  if (fromMeta) return fromMeta;
  if (customerId) return findTenantIdByStripeCustomer(customerId);
  return null;
}

async function billingFromCustomer(customerId: string): Promise<TenantBilling> {
  const stripe = getStripe();
  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 20
  });
  const paid = list.data.filter((subscription) => isAddonSubscribed(subscription.status));
  const priceIds = paid.flatMap((subscription) => priceIdsFromSubscription(subscription));
  const primary = paid[0] ?? list.data[0];
  const status = paid[0]?.status ?? primary?.status ?? 'canceled';

  return billingFromPriceIds({
    stripeCustomerId: customerId,
    stripeSubscriptionId: paid[0]?.id ?? primary?.id ?? null,
    stripeStatus: status,
    priceIds
  });
}

async function applyCustomerBilling(tenantId: string, customerId: string): Promise<void> {
  await persistTenantBilling(tenantId, await billingFromCustomer(customerId));
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode !== 'subscription') return;
      const customerId = customerIdFrom(session.customer);
      const tenantId = await resolveTenantId(session.metadata, customerId);
      if (!tenantId || !customerId) return;
      await applyCustomerBilling(tenantId, customerId);
      return;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = customerIdFrom(subscription.customer);
      const tenantId = await resolveTenantId(subscription.metadata, customerId);
      if (!tenantId || !customerId) return;
      await applyCustomerBilling(tenantId, customerId);
      return;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = customerIdFrom(invoice.customer);
      const metadata =
        invoice.parent?.type === 'subscription_details'
          ? invoice.parent.subscription_details?.metadata
          : null;
      const tenantId = await resolveTenantId(metadata, customerId);
      if (!tenantId || !customerId) return;
      await applyCustomerBilling(tenantId, customerId);
      return;
    }
    default:
      return;
  }
}

export async function confirmCheckoutSession(
  sessionId: string,
  expectedTenantId: string
): Promise<void> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ['subscription']
  });
  const tenantId = session.metadata?.tenantId;
  if (tenantId !== expectedTenantId) {
    throw new Error('Checkout session does not belong to this workspace.');
  }
  const customerId = customerIdFrom(session.customer);
  if (!customerId) return;
  await applyCustomerBilling(expectedTenantId, customerId);
}
