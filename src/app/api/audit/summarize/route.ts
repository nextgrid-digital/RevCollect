import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auditNarrativeSchema, type AuditNarrative } from '@/features/audit/lib/audit-narrative';

const requestSchema = z.object({
  facts: z.record(z.string(), z.unknown())
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

async function generateWithGemini(facts: Record<string, unknown>): Promise<AuditNarrative> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const prompt = `You write narrative copy for a RevCollect AR Collection Audit report.
Tone: calm, editorial, direct — like a senior collections advisor. No hype, no emojis, no markdown.

Rules:
- Use ONLY the numbers and names in FACTS. Do not invent customers, amounts, or day counts.
- Prefer the preformatted moneyLabels strings when mentioning dollars.
- Keep each field to 1–3 sentences (coverTeaser: 1–2 sentences).
- Do not change recommended first moves; you may reference them in whyOrderCopy.
- Return STRICT JSON only, with exactly these keys:
  page1Intro, coverClosing, coverTeaser, termsGapCopy, agingNinetyCallout,
  interestHeadline, interestCopy, priorityIntro, whyOrderCopy,
  modelPayersCopy, creditDonorsCopy, oneToWatchCopy, fixReleaseCopy

FACTS:
${JSON.stringify(facts, null, 2)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 280)}`);
  }

  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return auditNarrativeSchema.parse(extractJsonObject(text));
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const narrative = await generateWithGemini(body.facts);
    return NextResponse.json({ narrative });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not generate narrative';
    const status = message.includes('GEMINI_API_KEY') ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
