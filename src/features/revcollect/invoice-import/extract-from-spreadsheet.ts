import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';
import type { InvoiceImportDraft } from './types';
import { emptyInvoiceDraft } from './extract-invoice-from-pdf';

/** Xero rejects line amounts above this. */
const MAX_XERO_LINE_AMOUNT = 999_999_999_999.99;

type HeaderKey =
  | 'customer'
  | 'email'
  | 'invoiceNumber'
  | 'issueDate'
  | 'dueDate'
  | 'description'
  | 'amount'
  | 'openAmount'
  | 'amountPaid'
  | 'status'
  | 'paymentDate'
  | 'daysPastDue'
  | 'daysToPay'
  | 'bucket'
  | 'termsDays';

type HeaderMap = Record<HeaderKey, number>;

function normalizeDate(value: unknown): string {
  if (!value && value !== 0) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{5}$/.test(str)) {
    const epoch = new Date((Number(str) - 25569) * 86400 * 1000);
    if (!Number.isNaN(epoch.getTime())) return epoch.toISOString().slice(0, 10);
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

function normalizeAmount(value: unknown): number {
  if (value instanceof Date) return 0;

  if (typeof value === 'number' && Number.isFinite(value)) {
    const amount = Math.abs(value);
    if (amount > MAX_XERO_LINE_AMOUNT) return 0;
    return amount;
  }

  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  if (/[a-z]/i.test(raw.replace(/[eE]/g, ''))) return 0;

  let cleaned = raw.replace(/[^0-9.,\-]/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parts = cleaned.split(',');
    cleaned =
      parts.length === 2 && parts[1].length <= 2
        ? `${parts[0].replace(/\./g, '')}.${parts[1]}`
        : cleaned.replace(/,/g, '');
  }

  const num = Number.parseFloat(cleaned);
  if (!Number.isFinite(num)) return 0;
  const amount = Math.abs(num);
  if (amount > MAX_XERO_LINE_AMOUNT) return 0;
  return amount;
}

function normalizeInt(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  const cleaned = String(value).replace(/[^0-9.\-]/g, '');
  const num = Number.parseFloat(cleaned);
  if (!Number.isFinite(num)) return undefined;
  return Math.trunc(num);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addDaysToIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return plusDaysIso(days);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, '');
}

/**
 * Exact header aliases for this AR export format and common variants.
 * More specific keys are matched before looser ones; each column binds once.
 */
const HEADER_ALIASES: Array<{ key: HeaderKey; aliases: string[] }> = [
  { key: 'email', aliases: ['customeremail', 'email', 'emailaddress', 'e-mail'] },
  {
    key: 'invoiceNumber',
    aliases: ['invoicenumber', 'invoiceno', 'invoicenum', 'invnumber', 'inv#', 'invoice#']
  },
  { key: 'issueDate', aliases: ['invoicedate', 'issuedate', 'date'] },
  { key: 'dueDate', aliases: ['duedate', 'due'] },
  {
    key: 'openAmount',
    aliases: ['openamount', 'amountopen', 'outstanding', 'balance due', 'balancedue', 'amountdue']
  },
  { key: 'amountPaid', aliases: ['amountpaid', 'paidamount', 'paymentamount'] },
  { key: 'amount', aliases: ['amount', 'invoicetotal', 'total', 'invoiceamount', 'value'] },
  { key: 'status', aliases: ['status', 'invoicestatus', 'paymentstatus'] },
  { key: 'paymentDate', aliases: ['paymentdate', 'paiddate', 'datepaid'] },
  { key: 'daysPastDue', aliases: ['dayspastdue', 'pastdue', 'daysoverdue', 'overduedays'] },
  { key: 'daysToPay', aliases: ['daystopay', 'daystopayment'] },
  { key: 'bucket', aliases: ['bucket', 'agingbucket', 'agebucket'] },
  { key: 'termsDays', aliases: ['termsdays', 'terms', 'paymentterms', 'netdays'] },
  {
    key: 'customer',
    aliases: [
      'customer',
      'customername',
      'client',
      'clientname',
      'company',
      'companyname',
      'buyer',
      'name',
      'billto'
    ]
  },
  { key: 'description', aliases: ['description', 'desc', 'memo', 'notes', 'subject', 'lineitem'] }
];

function detectHeaders(row: unknown[]): HeaderMap | null {
  const map: Partial<HeaderMap> = {};
  const usedColumns = new Set<number>();
  const normalizedCells = row.map((cell) => normalizeHeader(cell));

  for (const { key, aliases } of HEADER_ALIASES) {
    if (map[key] !== undefined) continue;
    const aliasSet = new Set(aliases.map((alias) => normalizeHeader(alias)));
    for (let i = 0; i < normalizedCells.length; i++) {
      if (usedColumns.has(i)) continue;
      const cell = normalizedCells[i];
      if (!cell) continue;
      if (aliasSet.has(cell)) {
        map[key] = i;
        usedColumns.add(i);
        break;
      }
    }
  }

  // Loose fallbacks only if still missing (never steal AmountPaid / DueDate into Amount)
  if (map.amount === undefined) {
    for (let i = 0; i < normalizedCells.length; i++) {
      if (usedColumns.has(i)) continue;
      const cell = normalizedCells[i];
      if (cell === 'amount' || cell === 'total' || cell === 'balance') {
        map.amount = i;
        usedColumns.add(i);
        break;
      }
    }
  }

  if (map.customer === undefined && map.amount === undefined && map.openAmount === undefined) {
    return null;
  }

  return {
    customer: map.customer ?? -1,
    email: map.email ?? -1,
    invoiceNumber: map.invoiceNumber ?? -1,
    issueDate: map.issueDate ?? -1,
    dueDate: map.dueDate ?? -1,
    description: map.description ?? -1,
    amount: map.amount ?? -1,
    openAmount: map.openAmount ?? -1,
    amountPaid: map.amountPaid ?? -1,
    status: map.status ?? -1,
    paymentDate: map.paymentDate ?? -1,
    daysPastDue: map.daysPastDue ?? -1,
    daysToPay: map.daysToPay ?? -1,
    bucket: map.bucket ?? -1,
    termsDays: map.termsDays ?? -1
  };
}

function cell(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) return '';
  const value = row[index];
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').trim();
}

function isPaidStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes('partial')) return false;
  return (
    normalized === 'paid' || normalized.startsWith('paid-') || normalized.includes('paid in full')
  );
}

export function extractDraftsFromSpreadsheet(
  bytes: ArrayBuffer,
  fileName: string
): InvoiceImportDraft[] {
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [emptyInvoiceDraft(fileName, randomUUID())];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  if (rows.length < 2) return [emptyInvoiceDraft(fileName, randomUUID())];

  let headerMap: HeaderMap | null = null;
  let headerRow = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    headerMap = detectHeaders(rows[i]);
    if (headerMap) {
      headerRow = i;
      break;
    }
  }

  if (!headerMap) {
    const draft = emptyInvoiceDraft(fileName, randomUUID());
    draft.notes = 'Could not detect column headers. Fill fields manually.';
    return [draft];
  }

  const hasOpenAmountColumn = headerMap.openAmount >= 0;
  const drafts: InvoiceImportDraft[] = [];

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const customerName = cell(row, headerMap.customer);
    const invoiceAmount = normalizeAmount(row[headerMap.amount]);
    const openAmount =
      headerMap.openAmount >= 0 ? normalizeAmount(row[headerMap.openAmount]) : undefined;
    const amountPaid =
      headerMap.amountPaid >= 0 ? normalizeAmount(row[headerMap.amountPaid]) : undefined;
    const status = cell(row, headerMap.status);
    const paymentDate = normalizeDate(row[headerMap.paymentDate]) || undefined;
    const daysPastDue = normalizeInt(row[headerMap.daysPastDue]);
    const daysToPay = normalizeInt(row[headerMap.daysToPay]);
    const bucket = cell(row, headerMap.bucket) || undefined;
    const termsDays = normalizeInt(row[headerMap.termsDays]);
    const invoiceNumber = cell(row, headerMap.invoiceNumber);

    const issueDate = normalizeDate(row[headerMap.issueDate]) || todayIso();
    let dueDate = normalizeDate(row[headerMap.dueDate]);
    if (!dueDate && termsDays != null && termsDays >= 0) {
      dueDate = addDaysToIso(issueDate, termsDays);
    }
    if (!dueDate) dueDate = plusDaysIso(30);

    // Prefer outstanding balance for Xero create when OpenAmount column exists.
    const amountForXero = hasOpenAmountColumn
      ? (openAmount ?? 0)
      : invoiceAmount > 0
        ? invoiceAmount
        : (openAmount ?? 0);

    if (!customerName && invoiceAmount === 0 && (openAmount ?? 0) === 0) continue;

    const paid = isPaidStatus(status) || (hasOpenAmountColumn && (openAmount ?? 0) === 0);
    const noteParts: string[] = [];
    if (status) noteParts.push(`Status: ${status}`);
    if (invoiceAmount > 0) noteParts.push(`Invoice amount: ${invoiceAmount}`);
    if (openAmount != null) noteParts.push(`Open amount: ${openAmount}`);
    if (amountPaid != null && amountPaid > 0) noteParts.push(`Amount paid: ${amountPaid}`);
    if (paymentDate) noteParts.push(`Payment date: ${paymentDate}`);
    if (daysPastDue != null) noteParts.push(`Days past due: ${daysPastDue}`);
    if (daysToPay != null) noteParts.push(`Days to pay: ${daysToPay}`);
    if (bucket) noteParts.push(`Bucket: ${bucket}`);
    if (paid && amountForXero <= 0) {
      noteParts.push('Fully paid / zero open balance — left unchecked for Xero create.');
    }
    if (!hasOpenAmountColumn && amountForXero <= 0) {
      noteParts.push('Amount missing or invalid — check the Amount column.');
    }

    drafts.push({
      id: randomUUID(),
      sourceFileName: fileName,
      customerName,
      customerEmail: cell(row, headerMap.email),
      invoiceNumber,
      issueDate,
      dueDate,
      description: cell(row, headerMap.description) || `Invoice ${invoiceNumber || i + 1}`,
      amount: amountForXero,
      currency: 'USD',
      confidence: customerName && (invoiceAmount > 0 || (openAmount ?? 0) > 0) ? 0.95 : 0.4,
      notes: noteParts.join(' · ') || undefined,
      selected: Boolean(customerName) && amountForXero > 0 && !paid,
      invoiceAmount: invoiceAmount || undefined,
      openAmount,
      amountPaid,
      status: status || undefined,
      paymentDate,
      daysPastDue,
      daysToPay,
      bucket,
      termsDays
    });
  }

  if (drafts.length === 0) {
    const draft = emptyInvoiceDraft(fileName, randomUUID());
    draft.notes = 'No data rows found in spreadsheet.';
    return [draft];
  }

  return drafts;
}
