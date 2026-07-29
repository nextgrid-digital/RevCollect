import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createXeroInvoicesFromDrafts } from '@/features/revcollect/invoice-import/create-xero-invoices';
import { XeroNotConnectedError } from '@/lib/integrations/xero-api';

export const runtime = 'nodejs';

const draftSchema = z.object({
  id: z.string().min(1),
  sourceFileName: z.string().min(1),
  customerName: z.string(),
  customerEmail: z.string(),
  invoiceNumber: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  description: z.string(),
  amount: z.number(),
  currency: z.string(),
  confidence: z.number(),
  notes: z.string().optional(),
  selected: z.boolean()
});

const bodySchema = z.object({
  drafts: z.array(draftSchema).min(1).max(50)
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const selected = body.drafts.filter((draft) => draft.selected);
    if (selected.length === 0) {
      return NextResponse.json({ error: 'Select at least one invoice to create' }, { status: 400 });
    }

    const results = await createXeroInvoicesFromDrafts(selected);
    const createdCount = results.filter((result) => result.ok).length;
    return NextResponse.json({ results, createdCount });
  } catch (error) {
    if (error instanceof XeroNotConnectedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid invoice payload' }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Failed to create invoices';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
