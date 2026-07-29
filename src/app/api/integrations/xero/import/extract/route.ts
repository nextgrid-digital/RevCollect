import { NextResponse, type NextRequest } from 'next/server';
import { extractInvoiceDraftFromPdf } from '@/features/revcollect/invoice-import/extract-invoice-from-pdf';
import { extractDraftsFromSpreadsheet } from '@/features/revcollect/invoice-import/extract-from-spreadsheet';
import { extractDraftsFromWord } from '@/features/revcollect/invoice-import/extract-from-word';
import { randomUUID } from 'crypto';
import type { InvoiceImportDraft } from '@/features/revcollect/invoice-import/types';

export const runtime = 'nodejs';

const MAX_FILES = 20;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

const SPREADSHEET_EXTS = new Set(['.xlsx', '.xls', '.csv']);
const WORD_EXTS = new Set(['.docx', '.doc']);
const PDF_EXTS = new Set(['.pdf']);
const ALLOWED_EXTS = new Set([...SPREADSHEET_EXTS, ...WORD_EXTS, ...PDF_EXTS]);

function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const files = form
      .getAll('files')
      .filter((entry): entry is File => typeof File !== 'undefined' && entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'Upload at least one file' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files per batch` }, { status: 400 });
    }

    const drafts: InvoiceImportDraft[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: `${file.name} is larger than 8 MB` }, { status: 400 });
      }

      const ext = extOf(file.name);
      if (!ALLOWED_EXTS.has(ext)) {
        return NextResponse.json(
          {
            error: `${file.name}: unsupported format. Use PDF, Excel (.xlsx/.xls/.csv), or Word (.docx/.doc).`
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();

      if (PDF_EXTS.has(ext)) {
        drafts.push(
          await extractInvoiceDraftFromPdf({
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            bytes,
            id: randomUUID()
          })
        );
      } else if (SPREADSHEET_EXTS.has(ext)) {
        drafts.push(...extractDraftsFromSpreadsheet(bytes, file.name));
      } else if (WORD_EXTS.has(ext)) {
        drafts.push(...(await extractDraftsFromWord(bytes, file.name)));
      }
    }

    return NextResponse.json({ drafts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract invoices';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
