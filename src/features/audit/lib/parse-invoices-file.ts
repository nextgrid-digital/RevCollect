import * as XLSX from 'xlsx';
import type { InvoiceRecord } from './types';
import {
  headersIncludeRequired,
  invoicesToCsv,
  parseInvoicesCsv,
  parseInvoicesTsv,
  REQUIRED_HEADERS,
  rowsToInvoiceRecords
} from './parse-invoices';

export type AuditUploadFormat = 'csv' | 'tsv' | 'xlsx' | 'xls';

export interface ParsedInvoiceUpload {
  invoices: InvoiceRecord[];
  /** Normalized CSV used for recompute. */
  csvText: string;
  format: AuditUploadFormat;
  sheetName?: string;
}

function extensionOf(file: File): string {
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1) : '';
}

export function detectUploadFormat(file: File): AuditUploadFormat {
  const ext = extensionOf(file);
  const mime = file.type.toLowerCase();

  if (ext === 'csv' || mime === 'text/csv' || mime === 'application/csv') return 'csv';
  if (ext === 'tsv' || mime === 'text/tab-separated-values') return 'tsv';
  if (
    ext === 'xlsx' ||
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return 'xlsx';
  }
  if (ext === 'xls' || mime === 'application/vnd.ms-excel') return 'xls';

  throw new Error('Unsupported file type. Upload a .csv, .tsv, .xlsx, or .xls export.');
}

const DATE_HEADERS = new Set(['InvoiceDate', 'DueDate', 'PaymentDate']);

function excelSerialToIso(value: number): string | null {
  const parsed = XLSX.SSF.parse_date_code(value);
  if (!parsed) return null;
  const yyyy = String(parsed.y).padStart(4, '0');
  const mm = String(parsed.m).padStart(2, '0');
  const dd = String(parsed.d).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function cellToString(value: unknown, header?: string): string {
  if (value == null) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    if (header && DATE_HEADERS.has(header)) {
      return excelSerialToIso(value) ?? String(value);
    }
    return String(value);
  }
  return String(value).trim();
}

function matrixToRows(matrix: unknown[][]): Record<string, string>[] {
  if (matrix.length < 2) {
    throw new Error('Spreadsheet must include a header row and at least one invoice.');
  }

  let headerIndex = -1;
  for (let i = 0; i < Math.min(matrix.length, 20); i++) {
    const headers = (matrix[i] ?? []).map((c) => cellToString(c));
    if (headersIncludeRequired(headers)) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error(
      `No sheet row contains the required columns (${REQUIRED_HEADERS.slice(0, 3).join(', ')}, …).`
    );
  }

  const headers = (matrix[headerIndex] ?? []).map((c) => cellToString(c));
  const rows: Record<string, string>[] = [];

  for (let r = headerIndex + 1; r < matrix.length; r++) {
    const cols = matrix[r] ?? [];
    const allEmpty = cols.every((c) => cellToString(c) === '');
    if (allEmpty) continue;

    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      if (!headers[i]) continue;
      row[headers[i]] = cellToString(cols[i], headers[i]);
    }
    rows.push(row);
  }

  return rows;
}

function parseWorkbook(buffer: ArrayBuffer): { invoices: InvoiceRecord[]; sheetName: string } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  if (workbook.SheetNames.length === 0) {
    throw new Error('Workbook has no sheets.');
  }

  const errors: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    try {
      const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
        header: 1,
        defval: '',
        raw: true
      });
      const rows = matrixToRows(matrix as unknown[][]);
      const invoices = rowsToInvoiceRecords(rows);
      return { invoices, sheetName };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not parse sheet';
      errors.push(`${sheetName}: ${message}`);
    }
  }

  throw new Error(
    `No sheet matched the required invoice columns. ${errors.slice(0, 3).join(' · ')}`
  );
}

export async function parseInvoicesFromFile(file: File): Promise<ParsedInvoiceUpload> {
  const format = detectUploadFormat(file);

  if (format === 'csv') {
    const text = await file.text();
    const invoices = parseInvoicesCsv(text);
    return { invoices, csvText: text.replace(/^\uFEFF/, ''), format };
  }

  if (format === 'tsv') {
    const text = await file.text();
    const invoices = parseInvoicesTsv(text);
    return { invoices, csvText: invoicesToCsv(invoices), format };
  }

  const buffer = await file.arrayBuffer();
  const { invoices, sheetName } = parseWorkbook(buffer);
  return {
    invoices,
    csvText: invoicesToCsv(invoices),
    format,
    sheetName
  };
}
