import {
  createXeroSalesInvoices,
  getXeroAccessContext,
  type CreateXeroInvoiceInput
} from '@/lib/integrations/xero-api';
import type { InvoiceImportCreateResult, InvoiceImportDraft } from './types';

function isValidDraft(draft: InvoiceImportDraft): string | null {
  if (!draft.customerName.trim()) return 'Customer name is required';
  if (!(draft.amount > 0)) return 'Amount must be greater than 0';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.issueDate)) return 'Issue date must be YYYY-MM-DD';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate)) return 'Due date must be YYYY-MM-DD';
  return null;
}

export async function createXeroInvoicesFromDrafts(
  drafts: InvoiceImportDraft[]
): Promise<InvoiceImportCreateResult[]> {
  const context = await getXeroAccessContext();
  const results: InvoiceImportCreateResult[] = [];

  for (const draft of drafts) {
    const validationError = isValidDraft(draft);
    if (validationError) {
      results.push({
        id: draft.id,
        sourceFileName: draft.sourceFileName,
        ok: false,
        error: validationError
      });
      continue;
    }

    const payload: CreateXeroInvoiceInput = {
      contactName: draft.customerName.trim(),
      contactEmail: draft.customerEmail.trim() || undefined,
      invoiceNumber: draft.invoiceNumber.trim() || undefined,
      date: draft.issueDate,
      dueDate: draft.dueDate,
      status: 'AUTHORISED',
      reference: draft.sourceFileName,
      lineItems: [
        {
          description: draft.description.trim() || `Invoice ${draft.invoiceNumber || draft.id}`,
          quantity: 1,
          unitAmount: draft.amount
        }
      ]
    };

    try {
      const created = await createXeroSalesInvoices(context, [payload]);
      const invoice = created[0];
      results.push({
        id: draft.id,
        sourceFileName: draft.sourceFileName,
        ok: Boolean(invoice?.InvoiceID),
        xeroInvoiceId: invoice?.InvoiceID,
        xeroInvoiceNumber: invoice?.InvoiceNumber,
        error: invoice?.InvoiceID ? undefined : 'Xero did not return an invoice id'
      });
    } catch (error) {
      results.push({
        id: draft.id,
        sourceFileName: draft.sourceFileName,
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice in Xero'
      });
    }
  }

  return results;
}
