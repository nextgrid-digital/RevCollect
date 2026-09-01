export const MAX_INVOICE_ATTACHMENTS = 10;

export interface InvoiceRef {
  id: string;
  number: string;
}

export function invoicePdfPath(invoiceId: string): string {
  return `/api/revcollect/invoices/${encodeURIComponent(invoiceId)}/pdf`;
}

export function sanitizeInvoicePdfFilename(invoiceNumber: string): string {
  const trimmed = invoiceNumber.trim().replace(/[^\w.-]+/g, '_') || 'invoice';
  return trimmed.slice(0, 80);
}

export function toInvoiceRef(invoice: InvoiceRef): InvoiceRef {
  return { id: invoice.id, number: invoice.number };
}
