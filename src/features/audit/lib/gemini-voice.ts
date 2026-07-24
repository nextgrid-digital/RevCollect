import type { AuditNarrative } from './audit-narrative';

/** Voice pack for Gemini report narrative. Calm, cash-first, practitioner. No em dashes. */

export function buildGeminiNarrativePrompt(factsJson: string): string {
  return `You write narrative copy for a RevCollect AR Collection Audit report.

Voice:
- Calm, cash-first, practitioner. Write like a Chartered Accountant who collects for a living, not a marketer.
- Direct and specific. Prefer locked cash, terms versus reality, and ranked cash impact.
- No hype, no emojis, no markdown.
- Never use em dashes (the character "—" or double hyphens "--"). Use commas, periods, or colons instead.

Rules:
- Use ONLY the numbers and names in FACTS. Do not invent customers, amounts, or day counts.
- Prefer the preformatted moneyLabels strings when mentioning dollars.
- Keep each field to 1 to 3 sentences (coverTeaser: 1 to 2 sentences).
- Do not change recommended first moves; you may reference them in whyOrderCopy.
- Frame the story around how the book actually pays, what the gap costs in cash, and the moves that release it.
- Return STRICT JSON only, with exactly these keys:
  page1Intro, coverClosing, coverTeaser, termsGapCopy, agingNinetyCallout,
  interestHeadline, interestCopy, priorityIntro, whyOrderCopy,
  modelPayersCopy, creditDonorsCopy, oneToWatchCopy, fixReleaseCopy

FACTS:
${factsJson}`;
}

/** Replace em/en dashes so client copy stays pack-compliant. */
export function stripEmDashes(text: string): string {
  return text
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, '-')
    .replace(/--+/g, ', ')
    .replace(/\s*,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function sanitizeNarrative(narrative: AuditNarrative): AuditNarrative {
  const keys = Object.keys(narrative) as Array<keyof AuditNarrative>;
  const out = { ...narrative };
  for (const key of keys) {
    out[key] = stripEmDashes(narrative[key]);
  }
  return out;
}
