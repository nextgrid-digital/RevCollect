import { getConnectedBooksProvider } from '@/lib/canonical/ingest-accounting';
import { getCanonicalStore } from '@/lib/canonical/store';
import { fetchXeroInvoicePdf, getXeroAccessContext } from '@/lib/integrations/xero-api';
import { fetchZohoInvoicePdf } from '@/lib/integrations/zoho-api';

async function resolveLedgerInvoiceId(tenantId: string, invoiceId: string): Promise<string> {
  const snapshot = await (await getCanonicalStore()).read(tenantId);
  const invoice = snapshot.invoices.find((item) => item.id === invoiceId);
  return invoice?.externalId ?? invoiceId;
}

export async function fetchConnectedInvoicePdf(
  tenantId: string,
  invoiceId: string
): Promise<Buffer> {
  const provider = await getConnectedBooksProvider(tenantId);
  if (provider === 'zoho') {
    const ledgerId = await resolveLedgerInvoiceId(tenantId, invoiceId);
    return fetchZohoInvoicePdf(tenantId, ledgerId);
  }
  if (provider === 'xero') {
    const context = await getXeroAccessContext(tenantId);
    return fetchXeroInvoicePdf(context, invoiceId);
  }
  throw new Error('Invoice PDFs are not available for this ledger yet.');
}
