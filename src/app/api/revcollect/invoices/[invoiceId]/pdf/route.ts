import { NextResponse } from 'next/server';
import { getXeroRevCollectService } from '@/features/revcollect/api/xero-service';
import { sanitizeInvoicePdfFilename } from '@/features/revcollect/lib/invoice-pdf';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import {
  fetchXeroInvoicePdf,
  getXeroAccessContext,
  XeroNotConnectedError
} from '@/lib/integrations/xero-api';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;
  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });
  }

  try {
    const invoices = await getXeroRevCollectService().listInvoices();
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const context = await getXeroAccessContext();
    const pdf = await fetchXeroInvoicePdf(context, invoice.id);
    const filename = `${sanitizeInvoicePdfFilename(invoice.number)}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=60'
      }
    });
  } catch (error) {
    if (error instanceof XeroNotConnectedError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : 'Could not load invoice PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
