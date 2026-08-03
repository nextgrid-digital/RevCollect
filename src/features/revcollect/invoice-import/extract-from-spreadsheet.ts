import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';
import type { InvoiceImportDraft } from './types';
import { emptyInvoiceDraft } from './extract-invoice-from-pdf';

/** Xero rejects line amounts above this. */
const MAX_XERO_LINE_AMOUNT = 999_999_999_999.99;

function normalizeDate(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
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
  // Dates accidentally mapped to Amount become huge digit strings — never treat as money.
  if (value instanceof Date) return 0;

  if (typeof value === 'number' && Number.isFinite(value)) {
    const amount = Math.abs(value);
    if (amount > MAX_XERO_LINE_AMOUNT) return 0;
    return amount;
  }

  const raw = String(value ?? '').trim();
  if (!raw || /[a-z]/i.test(raw.replace(/[eE]/g, ''))) {
    // Reject date-like / textual values (e.g. "Sat Feb 01 2025...")
    if (/[a-z]/i.test(raw)) return 0;
  }

  // Support 25,350 and 25.350,00 style amounts
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plus30(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString().slice(0, 10);
}

interface HeaderMap {
  customer: number;
  email: number;
  invoiceNumber: number;
  issueDate: number;
  dueDate: number;
  description: number;
  amount: number;
}

/** More specific patterns first. Each column may only bind to one field. */
const HEADER_MATCHERS: Array<{ key: keyof HeaderMap; pattern: RegExp }> = [
  { key: 'email', pattern: /^(customer)?e-?mail$/i },
  { key: 'invoiceNumber', pattern: /^(invoice)?(#|no\.?|number)$|^inv(?:oice)?(?:number|#)?$/i },
  { key: 'issueDate', pattern: /^(invoice)?date$|^issue(date)?$/i },
  { key: 'dueDate', pattern: /^due(date)?$/i },
  { key: 'amount', pattern: /^amount$|^total$|^balance$|^value$/i },
  { key: 'customer', pattern: /^(customer|client|company|buyer|name)$|^billto$/i },
  { key: 'description', pattern: /^(desc(ription)?|memo|notes|subject)$/i },
  // Looser fallbacks (still exclusive — skips AmountPaid, DaysPastDue, PaymentDate)
  { key: 'email', pattern: /email|e-mail/i },
  { key: 'invoiceNumber', pattern: /invoice.*number|inv(?:oice)?(?:\s*#)?/i },
  { key: 'issueDate', pattern: /invoice.*date|issue/i },
  { key: 'dueDate', pattern: /due.*date/i },
  { key: 'amount', pattern: /amount(?!\s*paid)|^(total|balance|value)$/i },
  { key: 'customer', pattern: /customer|client|company|buyer|bill\s*to/i },
  { key: 'description', pattern: /desc|memo|notes|subject/i }
];

function detectHeaders(row: unknown[]): HeaderMap | null {
  const map: Partial<HeaderMap> = {};
  const usedColumns = new Set<number>();

  for (const { key, pattern } of HEADER_MATCHERS) {
    if (map[key] !== undefined) continue;
    for (let i = 0; i < row.length; i++) {
      if (usedColumns.has(i)) continue;
      const cell = String(row[i] ?? '').trim();
      if (!cell) continue;
      if (pattern.test(cell)) {
        map[key] = i;
        usedColumns.add(i);
        break;
      }
    }
  }

  if (map.customer === undefined && map.amount === undefined) return null;
  return {
    customer: map.customer ?? -1,
    email: map.email ?? -1,
    invoiceNumber: map.invoiceNumber ?? -1,
    issueDate: map.issueDate ?? -1,
    dueDate: map.dueDate ?? -1,
    description: map.description ?? -1,
    amount: map.amount ?? -1
  };
}

function cell(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) return '';
  const value = row[index];
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').trim();
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

  const drafts: InvoiceImportDraft[] = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const customerName = cell(row, headerMap.customer);
    const amount = normalizeAmount(row[headerMap.amount]);
    if (!customerName && amount === 0) continue;

    drafts.push({
      id: randomUUID(),
      sourceFileName: fileName,
      customerName,
      customerEmail: cell(row, headerMap.email),
      invoiceNumber: cell(row, headerMap.invoiceNumber),
      issueDate: normalizeDate(row[headerMap.issueDate]) || todayIso(),
      dueDate: normalizeDate(row[headerMap.dueDate]) || plus30(),
      description:
        cell(row, headerMap.description) ||
        `Invoice ${cell(row, headerMap.invoiceNumber) || i + 1}`,
      amount,
      currency: 'USD',
      confidence: customerName && amount > 0 ? 0.9 : 0.3,
      notes:
        amount <= 0
          ? 'Amount missing or invalid — check the Amount column in your spreadsheet.'
          : undefined,
      selected: Boolean(customerName) && amount > 0
    });
  }

  if (drafts.length === 0) {
    const draft = emptyInvoiceDraft(fileName, randomUUID());
    draft.notes = 'No data rows found in spreadsheet.';
    return [draft];
  }

  return drafts;
}
