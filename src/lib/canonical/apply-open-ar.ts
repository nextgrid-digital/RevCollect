import type { Customer, Invoice } from '@/features/revcollect/types';
import { restoreCollectionOverrides } from '@/features/revcollect/lib/collection-decision';
import {
  policyFromCustomer,
  reconcilePaymentClaimedCustomer,
  restoreRelationshipPolicies
} from '@/features/revcollect/lib/relationship-policy';
import { extractSituation } from '@/features/revcollect/extract/extract-situation';
import { emptyIntelligence } from './defaults';
import { recomputePatternsForSnapshot } from './patterns';
import { getCanonicalStore } from './store';
import { overlayInboxWithSentEmails } from './sent-emails';
import { buildSyntheticInboxFromInvoices } from '@/features/revcollect/api/xero-map';
import type { CanonicalPayment, CanonicalSnapshot } from './types';

export async function applyOpenArSnapshot(
  tenantId: string,
  input: {
    customers: Customer[];
    invoices: Invoice[];
    payments: CanonicalPayment[];
  }
): Promise<CanonicalSnapshot> {
  const store = await getCanonicalStore();
  const current = await store.read(tenantId);
  let customers = restoreCollectionOverrides(input.customers, current.customers);
  customers = restoreRelationshipPolicies(customers, current.customers);
  const previousPaymentIds = new Set(current.payments.map((payment) => payment.id));
  const receivedPaymentIds = new Set(
    input.payments
      .filter((payment) => !previousPaymentIds.has(payment.id))
      .map((payment) => payment.customerId)
  );
  customers = customers.map((customer) =>
    reconcilePaymentClaimedCustomer(customer, {
      receivedPayment: receivedPaymentIds.has(customer.id)
    })
  );
  const inboxMessages = overlayInboxWithSentEmails(
    buildSyntheticInboxFromInvoices(input.invoices, customers),
    current.sentEmails ?? []
  );
  const intelligenceByCustomerId = { ...current.intelligenceByCustomerId };
  for (const customer of customers) {
    const policy = policyFromCustomer(customer);
    intelligenceByCustomerId[customer.id] = {
      ...(intelligenceByCustomerId[customer.id] ?? emptyIntelligence()),
      relationshipState: policy.state,
      relationshipPolicy: policy
    };
    customer.relationshipState = policy.state;
    customer.relationshipPolicy = policy;
  }

  let snapshot: CanonicalSnapshot = {
    ...current,
    customers,
    invoices: input.invoices,
    payments: input.payments,
    inboxMessages,
    intelligenceByCustomerId,
    ingestedAt: new Date().toISOString()
  };
  snapshot = recomputePatternsForSnapshot(snapshot);
  await store.write(tenantId, snapshot);

  for (const payment of input.payments) {
    if (previousPaymentIds.has(payment.id)) continue;
    try {
      await extractSituation({
        tenantId,
        customerId: payment.customerId,
        kind: 'payment',
        text: `Payment of ${payment.amountCents} cents received on ${payment.paidAt} for invoice ${payment.invoiceId ?? 'unknown'}.`
      });
    } catch (error) {
      console.error('[apply-open-ar] extractSituation failed:', error);
    }
  }

  try {
    return await (await getCanonicalStore()).read(tenantId);
  } catch (error) {
    console.error('[apply-open-ar] snapshot re-read failed:', error);
    return snapshot;
  }
}
