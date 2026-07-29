import { randomUUID } from 'crypto';
import type { InvoiceImportDraft } from './types';
import { emptyInvoiceDraft } from './extract-invoice-from-pdf';

function extractTextFromDocx(bytes: ArrayBuffer): string {
  const uint = new Uint8Array(bytes);
  const textChunks: string[] = [];

  const decoder = new TextDecoder('utf-8', { fatal: false });
  const raw = decoder.decode(uint);

  const xmlStart = raw.indexOf('<w:document');
  if (xmlStart === -1) {
    return raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const textMatches = raw.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
  for (const match of textMatches) {
    textChunks.push(match[1]);
  }

  return textChunks.join(' ').replace(/\s+/g, ' ').trim();
}

export async function extractDraftsFromWord(
  bytes: ArrayBuffer,
  fileName: string
): Promise<InvoiceImportDraft[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  const text = extractTextFromDocx(bytes);
  if (!text || text.length < 10) {
    const draft = emptyInvoiceDraft(fileName, randomUUID());
    draft.notes = 'Could not extract text from Word document. Fill fields manually.';
    return [draft];
  }

  if (!apiKey) {
    const draft = emptyInvoiceDraft(fileName, randomUUID());
    draft.notes = `GEMINI_API_KEY not set. Extracted text starts with: "${text.slice(0, 200)}…"`;
    return [draft];
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const prompt = `Below is text extracted from a Word document containing one or more invoices.
Extract each invoice as a JSON object in an array.
Each object must have keys:
customerName, customerEmail, invoiceNumber, issueDate (YYYY-MM-DD), dueDate (YYYY-MM-DD),
description, amount (number), currency (ISO code), confidence (0-1).
If a field is missing, use empty string or 0. Prefer the customer/buyer, not the seller.
Return ONLY a JSON array.

Text:
${text.slice(0, 8000)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!res.ok) {
    const draft = emptyInvoiceDraft(fileName, randomUUID());
    draft.notes = `Gemini extraction failed (${res.status}). Fill fields manually.`;
    return [draft];
  }

  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const responseText =
    payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

  try {
    const trimmed = responseText.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = fenced?.[1]?.trim() ?? trimmed;
    const arrStart = jsonStr.indexOf('[');
    const arrEnd = jsonStr.lastIndexOf(']');
    const parsed =
      arrStart !== -1 && arrEnd > arrStart
        ? (JSON.parse(jsonStr.slice(arrStart, arrEnd + 1)) as unknown[])
        : [JSON.parse(jsonStr) as unknown];

    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.map((item) => {
      const obj = item as Record<string, unknown>;
      return {
        id: randomUUID(),
        sourceFileName: fileName,
        customerName: String(obj.customerName ?? '').trim(),
        customerEmail: String(obj.customerEmail ?? '').trim(),
        invoiceNumber: String(obj.invoiceNumber ?? '').trim(),
        issueDate: String(obj.issueDate ?? '').trim() || new Date().toISOString().slice(0, 10),
        dueDate:
          String(obj.dueDate ?? '').trim() ||
          (() => {
            const d = new Date();
            d.setUTCDate(d.getUTCDate() + 30);
            return d.toISOString().slice(0, 10);
          })(),
        description: String(obj.description ?? '').trim() || `From ${fileName}`,
        amount: Math.abs(Number(obj.amount) || 0),
        currency: String(obj.currency ?? 'USD').trim(),
        confidence: Number(obj.confidence) || 0.5,
        selected: Boolean(String(obj.customerName ?? '').trim()) && Number(obj.amount) > 0
      };
    });
  } catch {
    const draft = emptyInvoiceDraft(fileName, randomUUID());
    draft.notes = 'Could not parse Gemini response for Word document. Fill fields manually.';
    return [draft];
  }
}
