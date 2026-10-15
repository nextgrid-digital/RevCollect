import { isUuid, ledgerEntityUuid } from './ledger-entity-id';
import type { CanonicalPayment } from './types';

export function toPaymentRows(
  tenantId: string,
  payments: CanonicalPayment[],
  invoiceIds: Set<string>
): Array<{
  id: string;
  tenant_id: string;
  customer_id: string;
  invoice_id: string | null;
  amount_cents: number;
  paid_at: string;
  external_id: string;
}> {
  return payments.map((payment) => {
    const externalId = payment.externalId ?? payment.id;
    const id = isUuid(payment.id) ? payment.id : ledgerEntityUuid(tenantId, 'payment', externalId);
    const customerId = isUuid(payment.customerId)
      ? payment.customerId
      : ledgerEntityUuid(tenantId, 'customer', payment.customerId);
    const rawInvoiceId = payment.invoiceId
      ? isUuid(payment.invoiceId)
        ? payment.invoiceId
        : ledgerEntityUuid(tenantId, 'invoice', payment.invoiceId)
      : null;
    return {
      id,
      tenant_id: tenantId,
      customer_id: customerId,
      invoice_id: rawInvoiceId && invoiceIds.has(rawInvoiceId) ? rawInvoiceId : null,
      amount_cents: payment.amountCents,
      paid_at: payment.paidAt,
      external_id: externalId
    };
  });
}
