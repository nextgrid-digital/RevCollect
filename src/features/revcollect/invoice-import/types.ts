export interface InvoiceImportDraft {
  id: string;
  sourceFileName: string;
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  description: string;
  amount: number;
  currency: string;
  confidence: number;
  notes?: string;
  selected: boolean;
}

export interface InvoiceImportCreateResult {
  id: string;
  sourceFileName: string;
  ok: boolean;
  xeroInvoiceId?: string;
  xeroInvoiceNumber?: string;
  error?: string;
}
