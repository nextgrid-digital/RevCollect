import type { InvoiceRecord, RawInvoiceRow } from './types';

const REQUIRED_HEADERS = [
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

function parseCsvLine(line: string): string[] {
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
    if (ch === ',' && !inQuotes) {
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
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function parseTermsDays(terms: string): number {
  const match = terms.match(/(\d+)/);
  if (!match) return 30;
  return Number(match[1]);
}

export function parseInvoicesCsv(csvText: string): InvoiceRecord[] {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one invoice.');
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  const index = Object.fromEntries(headers.map((h, i) => [h, i])) as Record<
    (typeof REQUIRED_HEADERS)[number],
    number
  >;

  const records: InvoiceRecord[] = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
    const cols = parseCsvLine(lines[rowIndex]);
    const get = (key: (typeof REQUIRED_HEADERS)[number]) => (cols[index[key]] ?? '').trim();

    const invoiceDate = parseDate(get('InvoiceDate'));
    const dueDate = parseDate(get('DueDate'));
    const amount = parseNumber(get('Amount'));
    if (!invoiceDate || !dueDate || amount === null) {
      throw new Error(`Invalid invoice row ${rowIndex + 1}: check dates and amount.`);
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

export type { RawInvoiceRow };
