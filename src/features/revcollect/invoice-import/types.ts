export interface InvoiceImportDraft {
  id: string;
  sourceFileName: string;
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  description: string;
  /** Amount sent to Xero (prefers OpenAmount when present). */
  amount: number;
  currency: string;
  confidence: number;
  notes?: string;
  selected: boolean;
  /** Original spreadsheet Amount (invoice total). */
  invoiceAmount?: number;
  openAmount?: number;
  amountPaid?: number;
  status?: string;
  paymentDate?: string;
  daysPastDue?: number;
  daysToPay?: number;
  bucket?: string;
  termsDays?: number;
}

export interface InvoiceImportCreateResult {
  id: string;
  sourceFileName: string;
  ok: boolean;
  xeroInvoiceId?: string;
  xeroInvoiceNumber?: string;
  error?: string;
}
