import type { CanonicalPayment } from './types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

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
  return payments
    .filter((payment) => isUuid(payment.id) && isUuid(payment.customerId))
    .map((payment) => {
      const invoiceId = payment.invoiceId;
      return {
        id: payment.id,
        tenant_id: tenantId,
        customer_id: payment.customerId,
        invoice_id: invoiceId && isUuid(invoiceId) && invoiceIds.has(invoiceId) ? invoiceId : null,
        amount_cents: payment.amountCents,
        paid_at: payment.paidAt,
        external_id: payment.externalId ?? payment.id
      };
    });
}
