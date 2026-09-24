import { getConnectedBooksProvider } from '@/lib/canonical/ingest-accounting';
import { fetchXeroInvoicePdf, getXeroAccessContext } from '@/lib/integrations/xero-api';
import { fetchZohoInvoicePdf } from '@/lib/integrations/zoho-api';

export async function fetchConnectedInvoicePdf(
  tenantId: string,
  invoiceId: string
): Promise<Buffer> {
  const provider = await getConnectedBooksProvider(tenantId);
  if (provider === 'zoho') {
    return fetchZohoInvoicePdf(tenantId, invoiceId);
  }
  if (provider === 'xero') {
    const context = await getXeroAccessContext(tenantId);
    return fetchXeroInvoicePdf(context, invoiceId);
  }
  throw new Error('Invoice PDFs are not available for this ledger yet.');
}
