import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createXeroInvoicesFromDrafts } from '@/features/revcollect/invoice-import/create-xero-invoices';
import { XeroNotConnectedError } from '@/lib/integrations/xero-api';

export const runtime = 'nodejs';

const draftSchema = z.object({
  id: z.coerce.string().min(1),
  sourceFileName: z.coerce.string().min(1),
  customerName: z.coerce.string(),
  customerEmail: z.coerce.string(),
  invoiceNumber: z.coerce.string(),
  issueDate: z.coerce.string(),
  dueDate: z.coerce.string(),
  description: z.coerce.string(),
  amount: z.coerce.number().finite(),
  currency: z.coerce.string(),
  confidence: z.coerce.number().finite(),
  notes: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (typeof value === 'string' ? value : undefined)),
  selected: z.coerce.boolean()
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
      const firstIssue = error.issues[0];
      const issuePath = firstIssue?.path.length ? ` (${firstIssue.path.join('.')})` : '';
      return NextResponse.json({ error: `Invalid invoice payload${issuePath}` }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Failed to create invoices';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
