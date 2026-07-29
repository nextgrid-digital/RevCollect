import { NextResponse, type NextRequest } from 'next/server';
import { extractInvoiceDraftFromPdf } from '@/features/revcollect/invoice-import/extract-invoice-from-pdf';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const MAX_FILES = 20;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const files = form
      .getAll('files')
      .filter((entry): entry is File => typeof File !== 'undefined' && entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'Upload at least one PDF' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} PDFs per batch` }, { status: 400 });
    }

    const drafts = [];
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: `${file.name} is larger than 8MB` }, { status: 400 });
      }
      const mimeType = file.type || 'application/pdf';
      if (!mimeType.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json({ error: `${file.name} is not a PDF` }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      drafts.push(
        await extractInvoiceDraftFromPdf({
          fileName: file.name,
          mimeType,
          bytes,
          id: randomUUID()
        })
      );
    }

    return NextResponse.json({ drafts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract invoices';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
