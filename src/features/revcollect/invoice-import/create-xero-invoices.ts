import {
  createXeroSalesInvoices,
  findOrCreateXeroContact,
  getXeroAccessContext,
  type CreateXeroInvoiceInput
} from '@/lib/integrations/xero-api';
import type { InvoiceImportCreateResult, InvoiceImportDraft } from './types';

const CREATE_BATCH_SIZE = 25;

function isValidDraft(draft: InvoiceImportDraft): string | null {
  if (!draft.customerName.trim()) return 'Customer name is required';
  if (!(draft.amount > 0)) return 'Amount must be greater than 0';
  if (draft.amount > 999_999_999_999.99) {
    return 'Amount exceeds Xero maximum (check spreadsheet Amount column)';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.issueDate)) return 'Issue date must be YYYY-MM-DD';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate)) return 'Due date must be YYYY-MM-DD';
  return null;
}

export async function createXeroInvoicesFromDrafts(
  drafts: InvoiceImportDraft[]
): Promise<InvoiceImportCreateResult[]> {
  const context = await getXeroAccessContext();
  const results: InvoiceImportCreateResult[] = [];
  const contactIdByName = new Map<string, string>();

  const validDrafts: InvoiceImportDraft[] = [];

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
    validDrafts.push(draft);
  }

  for (const draft of validDrafts) {
    const name = draft.customerName.trim();
    if (contactIdByName.has(name)) continue;
    try {
      const contact = await findOrCreateXeroContact(context, {
        name,
        email: draft.customerEmail.trim() || undefined
      });
      contactIdByName.set(name, contact.ContactID);
    } catch (error) {
      contactIdByName.set(
        name,
        `__error__:${error instanceof Error ? error.message : 'Failed to create contact'}`
      );
    }
  }

  const ready: Array<{ draft: InvoiceImportDraft; payload: CreateXeroInvoiceInput }> = [];

  for (const draft of validDrafts) {
    const name = draft.customerName.trim();
    const contactId = contactIdByName.get(name) ?? '';
    if (!contactId || contactId.startsWith('__error__:')) {
      results.push({
        id: draft.id,
        sourceFileName: draft.sourceFileName,
        ok: false,
        error: contactId.startsWith('__error__:')
          ? contactId.slice('__error__:'.length)
          : 'Contact could not be resolved in Xero'
      });
      continue;
    }

    ready.push({
      draft,
      payload: {
        contactId,
        contactName: name,
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
      }
    });
  }

  for (let i = 0; i < ready.length; i += CREATE_BATCH_SIZE) {
    const batch = ready.slice(i, i + CREATE_BATCH_SIZE);
    try {
      const created = await createXeroSalesInvoices(
        context,
        batch.map((item) => item.payload)
      );

      for (let index = 0; index < batch.length; index++) {
        const draft = batch[index].draft;
        const invoice = created[index];
        const validationMessage = invoice?.ValidationErrors?.map((error) => error.Message)
          .filter(Boolean)
          .join('; ');

        results.push({
          id: draft.id,
          sourceFileName: draft.sourceFileName,
          ok: Boolean(invoice?.InvoiceID) && !invoice?.HasErrors,
          xeroInvoiceId: invoice?.InvoiceID,
          xeroInvoiceNumber: invoice?.InvoiceNumber,
          error:
            invoice?.InvoiceID && !invoice.HasErrors
              ? undefined
              : validationMessage || 'Xero did not create this invoice'
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create invoice in Xero';
      for (const item of batch) {
        results.push({
          id: item.draft.id,
          sourceFileName: item.draft.sourceFileName,
          ok: false,
          error: message
        });
      }
    }
  }

  return results;
}
