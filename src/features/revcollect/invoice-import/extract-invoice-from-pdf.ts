import { z } from 'zod';
import type { InvoiceImportDraft } from './types';

const extractedSchema = z.object({
  customerName: z.string().default(''),
  customerEmail: z.string().default(''),
  invoiceNumber: z.string().default(''),
  issueDate: z.string().default(''),
  dueDate: z.string().default(''),
  description: z.string().default(''),
  amount: z.number().finite().nonnegative().default(0),
  currency: z.string().default('USD'),
  confidence: z.number().min(0).max(1).default(0.5),
  notes: z.string().optional()
});

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response was not JSON');
  }
  return JSON.parse(raw.slice(start, end + 1)) as unknown;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return '';
}

export function emptyInvoiceDraft(sourceFileName: string, id: string): InvoiceImportDraft {
  return {
    id,
    sourceFileName,
    customerName: '',
    customerEmail: '',
    invoiceNumber: '',
    issueDate: todayIsoDate(),
    dueDate: plusDaysIso(30),
    description: 'Imported invoice',
    amount: 0,
    currency: 'USD',
    confidence: 0,
    notes: 'Fill in fields manually, then create in Xero.',
    selected: true
  };
}

export async function extractInvoiceDraftFromPdf(input: {
  fileName: string;
  mimeType: string;
  bytes: ArrayBuffer;
  id: string;
}): Promise<InvoiceImportDraft> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const draft = emptyInvoiceDraft(input.fileName, input.id);
    draft.notes = 'GEMINI_API_KEY is not set — enter invoice fields manually.';
    return draft;
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const base64 = Buffer.from(input.bytes).toString('base64');

  const prompt = `Extract accounts receivable invoice fields from this PDF.
Return ONLY JSON with keys:
customerName, customerEmail, invoiceNumber, issueDate (YYYY-MM-DD), dueDate (YYYY-MM-DD),
description, amount (number), currency (ISO code), confidence (0-1), notes (optional string).
If a field is missing, use empty string or 0. Prefer the customer/buyer, not the seller.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: input.mimeType || 'application/pdf',
                data: base64
              }
            },
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!res.ok) {
    const detail = await res.text();
    const draft = emptyInvoiceDraft(input.fileName, input.id);
    draft.notes = `Could not extract PDF (${res.status}). Enter fields manually. ${detail.slice(0, 120)}`;
    return draft;
  }

  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  if (!text) {
    return emptyInvoiceDraft(input.fileName, input.id);
  }

  const parsed = extractedSchema.parse(extractJsonObject(text));
  const issueDate = normalizeDate(parsed.issueDate) || todayIsoDate();
  const dueDate = normalizeDate(parsed.dueDate) || plusDaysIso(30);

  return {
    id: input.id,
    sourceFileName: input.fileName,
    customerName: parsed.customerName.trim(),
    customerEmail: parsed.customerEmail.trim(),
    invoiceNumber: parsed.invoiceNumber.trim(),
    issueDate,
    dueDate,
    description: parsed.description.trim() || `Invoice from ${input.fileName}`,
    amount: parsed.amount,
    currency: parsed.currency.trim() || 'USD',
    confidence: parsed.confidence,
    notes: parsed.notes,
    selected: parsed.amount > 0 && Boolean(parsed.customerName.trim())
  };
}
