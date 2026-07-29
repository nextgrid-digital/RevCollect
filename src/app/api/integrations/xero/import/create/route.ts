import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createXeroInvoicesFromDrafts } from '@/features/revcollect/invoice-import/create-xero-invoices';
import { XeroNotConnectedError } from '@/lib/integrations/xero-api';

export const runtime = 'nodejs';

const MAX_DRAFTS = 200;

function asString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

const draftSchema = z.preprocess(
  (raw) => {
    const value = (raw ?? {}) as Record<string, unknown>;
    return {
      id: asString(value.id),
      sourceFileName: asString(value.sourceFileName, 'import'),
      customerName: asString(value.customerName),
      customerEmail: asString(value.customerEmail),
      invoiceNumber: asString(value.invoiceNumber),
      issueDate: asString(value.issueDate),
      dueDate: asString(value.dueDate),
      description: asString(value.description),
      amount: asNumber(value.amount),
      currency: asString(value.currency, 'USD') || 'USD',
      confidence: asNumber(value.confidence, 0),
      notes: (() => {
        const notes = value.notes;
        if (notes == null) return undefined;
        if (typeof notes === 'string') return notes;
        if (typeof notes === 'number' || typeof notes === 'boolean') return String(notes);
        return undefined;
      })(),
      selected: asBoolean(value.selected, true)
    };
  },
  z.object({
    id: z.string().min(1),
    sourceFileName: z.string().min(1),
    customerName: z.string(),
    customerEmail: z.string(),
    invoiceNumber: z.string(),
    issueDate: z.string(),
    dueDate: z.string(),
    description: z.string(),
    amount: z.number().finite(),
    currency: z.string(),
    confidence: z.number().finite(),
    notes: z.string().optional(),
    selected: z.boolean()
  })
);

const bodySchema = z.object({
  drafts: z.array(draftSchema).min(1).max(MAX_DRAFTS)
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
      const detail = firstIssue?.message ? `: ${firstIssue.message}` : '';
      return NextResponse.json(
        { error: `Invalid invoice payload${issuePath}${detail}` },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to create invoices';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
