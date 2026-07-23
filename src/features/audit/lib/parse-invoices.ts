import type { InvoiceRecord, RawInvoiceRow } from './types';

export const REQUIRED_HEADERS = [
  'InvoiceNumber',
  'Customer',
  'CustomerEmail',
  'InvoiceDate',
  'Terms',
  'DueDate',
  'Amount',
  'Status',
  'PaymentDate',
  'AmountPaid',
  'DaysToPay',
  'DaysPastDue_AtPayment',
  'DaysPastDue_Current'
] as const;

export type RequiredHeader = (typeof REQUIRED_HEADERS)[number];

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  if (!Number.isNaN(d.getTime())) return d;
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function parseTermsDays(terms: string): number {
  const match = terms.match(/(\d+)/);
  if (!match) return 30;
  return Number(match[1]);
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize invoice records back to CSV so recompute stays on the text path. */
export function invoicesToCsv(records: InvoiceRecord[]): string {
  const header = REQUIRED_HEADERS.join(',');
  const lines = records.map((r) => {
    const cells: Record<RequiredHeader, string> = {
      InvoiceNumber: r.invoiceNumber,
      Customer: r.customer,
      CustomerEmail: r.customerEmail,
      InvoiceDate: r.invoiceDate.toISOString().slice(0, 10),
      Terms: r.terms,
      DueDate: r.dueDate.toISOString().slice(0, 10),
      Amount: String(r.amount),
      Status: r.status,
      PaymentDate: r.paymentDate ? r.paymentDate.toISOString().slice(0, 10) : '',
      AmountPaid: String(r.amountPaid),
      DaysToPay: r.daysToPay == null ? '' : String(r.daysToPay),
      DaysPastDue_AtPayment: r.daysLateAtPayment == null ? '' : String(r.daysLateAtPayment),
      DaysPastDue_Current: ''
    };
    return REQUIRED_HEADERS.map((h) => escapeCsvCell(cells[h])).join(',');
  });
  return [header, ...lines].join('\n');
}

export function headersIncludeRequired(headers: string[]): boolean {
  const set = new Set(headers.map((h) => h.trim()));
  return REQUIRED_HEADERS.every((h) => set.has(h));
}

export function rowsToInvoiceRecords(rows: Record<string, string>[]): InvoiceRecord[] {
  if (rows.length === 0) {
    throw new Error('Export must include a header row and at least one invoice.');
  }

  const headers = Object.keys(rows[0]);
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  const records: InvoiceRecord[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const get = (key: RequiredHeader) => (row[key] ?? '').trim();

    const invoiceDate = parseDate(get('InvoiceDate'));
    const dueDate = parseDate(get('DueDate'));
    const amount = parseNumber(get('Amount'));
    if (!invoiceDate || !dueDate || amount === null) {
      throw new Error(`Invalid invoice row ${rowIndex + 2}: check dates and amount.`);
    }

    const status = get('Status');
    const isOutstanding = status === 'Outstanding';
    const isPaid = status.startsWith('Paid');

    records.push({
      invoiceNumber: get('InvoiceNumber'),
      customer: get('Customer'),
      customerEmail: get('CustomerEmail'),
      invoiceDate,
      terms: get('Terms'),
      termsDays: parseTermsDays(get('Terms')),
      dueDate,
      amount,
      status,
      paymentDate: parseDate(get('PaymentDate')),
      amountPaid: parseNumber(get('AmountPaid')) ?? 0,
      daysToPay: parseNumber(get('DaysToPay')),
      daysLateAtPayment: parseNumber(get('DaysPastDue_AtPayment')),
      isPaid,
      isOutstanding
    });
  }

  return records;
}

export function parseInvoicesDelimited(text: string, delimiter: ',' | '\t' = ','): InvoiceRecord[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('Export must include a header row and at least one invoice.');
  }

  const headers = parseDelimitedLine(lines[0], delimiter).map((h) => h.trim());
  if (!headersIncludeRequired(headers)) {
    const missing = REQUIRED_HEADERS.find((h) => !headers.includes(h));
    throw new Error(`Missing required column: ${missing}`);
  }

  const rows: Record<string, string>[] = [];
  for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
    const cols = parseDelimitedLine(lines[rowIndex], delimiter);
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = cols[i] ?? '';
    }
    rows.push(row);
  }

  return rowsToInvoiceRecords(rows);
}

export function parseInvoicesCsv(csvText: string): InvoiceRecord[] {
  return parseInvoicesDelimited(csvText, ',');
}

export function parseInvoicesTsv(tsvText: string): InvoiceRecord[] {
  return parseInvoicesDelimited(tsvText, '\t');
}

export type { RawInvoiceRow };
