const INVOICE_NUMBER_PATTERN = /\bINV[- ]?[A-Z0-9-]*\d+\b/gi;
const AMOUNT_PATTERN = /\$\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/g;
const ISO_DATE_PATTERN = /\b(20\d{2}-\d{2}-\d{2})\b/g;

export interface DraftFacts {
  invoiceNumbers: string[];
  amounts: string[];
  dates: string[];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function uniqueNormalized(values: string[]): string[] {
  return [...new Set(values.map((value) => value.replaceAll(' ', '').toUpperCase()))];
}

export function extractDraftFacts(text: string): DraftFacts {
  const invoiceNumbers = uniqueNormalized(
    [...text.matchAll(INVOICE_NUMBER_PATTERN)].map((match) => match[0])
  );
  const amounts = [...text.matchAll(AMOUNT_PATTERN)].map((match) => match[1].replaceAll(',', ''));
  const dates = [...text.matchAll(ISO_DATE_PATTERN)].map((match) => match[1]);
  return { invoiceNumbers, amounts, dates };
}

export function validateDraftAgainstFacts(draft: string, allowed: DraftFacts): ValidationResult {
  const found = extractDraftFacts(draft);
  const errors: string[] = [];
  const allowedNumbers = uniqueNormalized(allowed.invoiceNumbers);
  const allowedAmounts = new Set(allowed.amounts.map((amount) => amount.replaceAll(',', '')));
  const allowedDates = new Set(allowed.dates);

  for (const number of found.invoiceNumbers) {
    if (allowedNumbers.length > 0 && !allowedNumbers.includes(number)) {
      errors.push(`Invented invoice number: ${number}`);
    }
  }

  for (const amount of found.amounts) {
    if (allowedAmounts.size > 0 && !allowedAmounts.has(amount)) {
      errors.push(`Invented amount: $${amount}`);
    }
  }

  for (const date of found.dates) {
    if (allowedDates.size > 0 && !allowedDates.has(date)) {
      errors.push(`Invented date: ${date}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

const BLOCKED_PHRASES = ['final warning', 'legal action', 'penalty', 'you are avoiding'] as const;

export interface CollectionLanguageOptions {
  allowLegalLanguage?: boolean;
  allowLateFeeMentions?: boolean;
}

export function validateCollectionLanguage(
  draft: string,
  options?: CollectionLanguageOptions
): ValidationResult {
  const errors: string[] = [];
  const lower = draft.toLowerCase();

  if (!options?.allowLegalLanguage) {
    for (const phrase of BLOCKED_PHRASES) {
      if (lower.includes(phrase)) {
        errors.push(`Blocked phrase: ${phrase}`);
      }
    }
  }

  if (!options?.allowLateFeeMentions && /late fee|late fees|finance charge/.test(lower)) {
    errors.push('Blocked phrase: late fee');
  }

  return { ok: errors.length === 0, errors };
}

export function validateQueuedDraft(
  draft: string,
  allowed: DraftFacts,
  options?: CollectionLanguageOptions
): ValidationResult {
  const facts = validateDraftAgainstFacts(draft, allowed);
  const language = validateCollectionLanguage(draft, options);
  const errors = [...facts.errors, ...language.errors];
  return { ok: errors.length === 0, errors };
}
