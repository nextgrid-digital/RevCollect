import { v5 as uuidv5, validate as uuidValidate } from 'uuid';
import type { Customer, Invoice } from '@/features/revcollect/types';
import type { CanonicalPayment } from './types';

/** Fixed namespace for deterministic ledger → UUID mapping (RevCollect v1). */
const LEDGER_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export type LedgerEntityKind = 'customer' | 'invoice' | 'payment' | 'inbox' | 'draft';

export function isUuid(value: string): boolean {
  return uuidValidate(value);
}

/**
 * Stable UUID for a ledger entity. Xero (and any already-UUID) ids pass through.
 * QBO/Zoho numeric/string ids map deterministically per tenant.
 */
export function ledgerEntityUuid(
  tenantId: string,
  kind: LedgerEntityKind,
  externalId: string
): string {
  if (isUuid(externalId)) return externalId;
  return uuidv5(`${tenantId}:${kind}:${externalId}`, LEDGER_NAMESPACE);
}

export interface RemappedOpenAr {
  customers: Customer[];
  invoices: Invoice[];
  payments: CanonicalPayment[];
}

/** Remap QBO/Zoho (non-UUID) ledger ids to stable UUIDs before persisting. */
export function remapOpenArIds(tenantId: string, input: RemappedOpenAr): RemappedOpenAr {
  const customerIdByExternal = new Map<string, string>();
  const invoiceIdByExternal = new Map<string, string>();

  const customers = input.customers.map((customer) => {
    const externalId = customer.externalId ?? customer.id;
    const id = ledgerEntityUuid(tenantId, 'customer', externalId);
    customerIdByExternal.set(customer.id, id);
    customerIdByExternal.set(externalId, id);
    return {
      ...customer,
      id,
      externalId: isUuid(externalId) ? customer.externalId : externalId
    };
  });

  const invoices = input.invoices.map((invoice) => {
    const externalId = invoice.externalId ?? invoice.id;
    const id = ledgerEntityUuid(tenantId, 'invoice', externalId);
    invoiceIdByExternal.set(invoice.id, id);
    invoiceIdByExternal.set(externalId, id);
    const customerId =
      customerIdByExternal.get(invoice.customerId) ??
      ledgerEntityUuid(tenantId, 'customer', invoice.customerId);
    return {
      ...invoice,
      id,
      customerId,
      externalId: isUuid(externalId) ? invoice.externalId : externalId
    };
  });

  const payments = input.payments.map((payment) => {
    const externalId = payment.externalId ?? payment.id;
    const id = ledgerEntityUuid(tenantId, 'payment', externalId);
    const customerId =
      customerIdByExternal.get(payment.customerId) ??
      ledgerEntityUuid(tenantId, 'customer', payment.customerId);
    const invoiceId = payment.invoiceId
      ? (invoiceIdByExternal.get(payment.invoiceId) ??
        ledgerEntityUuid(tenantId, 'invoice', payment.invoiceId))
      : undefined;
    return {
      ...payment,
      id,
      customerId,
      invoiceId,
      externalId
    };
  });

  return { customers, invoices, payments };
}
