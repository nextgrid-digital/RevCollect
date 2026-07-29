import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';
import type { InvoiceImportDraft } from './types';
import { emptyInvoiceDraft } from './extract-invoice-from-pdf';

function normalizeDate(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) {
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
  if (typeof value === 'number' && Number.isFinite(value)) return Math.abs(value);
  const cleaned = String(value ?? '')
    .replace(/[^0-9.\-]/g, '')
    .trim();
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? Math.abs(num) : 0;
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

const HEADER_PATTERNS: Record<keyof HeaderMap, RegExp> = {
  customer: /customer|client|company|buyer|bill\s*to|name/i,
  email: /email|e-mail/i,
  invoiceNumber: /invoice\s*#|invoice\s*no|inv\s*#|number/i,
  issueDate: /issue|invoice\s*date|date/i,
  dueDate: /due|payment\s*date/i,
  description: /desc|memo|notes|line|item|subject/i,
  amount: /amount|total|balance|due|value/i
};

function detectHeaders(row: unknown[]): HeaderMap | null {
  const map: Partial<HeaderMap> = {};
  for (let i = 0; i < row.length; i++) {
    const cell = String(row[i] ?? '').trim();
    if (!cell) continue;
    for (const [key, pattern] of Object.entries(HEADER_PATTERNS) as [keyof HeaderMap, RegExp][]) {
      if (map[key] === undefined && pattern.test(cell)) {
        map[key] = i;
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
  return String(row[index] ?? '').trim();
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
      description: cell(row, headerMap.description) || `Row ${i + 1} from ${fileName}`,
      amount,
      currency: 'USD',
      confidence: customerName && amount > 0 ? 0.8 : 0.3,
      notes: undefined,
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
