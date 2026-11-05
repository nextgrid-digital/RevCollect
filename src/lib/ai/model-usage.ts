import { jevBillableText } from '@/lib/ai/jev-request';

export interface ModelCallUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  usd: number | null;
  counted: 'provider' | 'estimate';
}

export interface DecisionUsage {
  writer: ModelCallUsage | null;
  jev: ModelCallUsage | null;
}

const JEV_INPUT_PER_MILLION = 0.042;

interface TokenRates {
  inputPerMillion: number;
  outputPerMillion: number;
  note: string;
}

function geminiRates(model: string): TokenRates | null {
  const id = model.toLowerCase();
  const promo = Date.now() < Date.parse('2027-01-01T00:00:00Z');
  if (id.includes('3.8-flash') || id.includes('flash-latest')) {
    return promo
      ? {
          inputPerMillion: 0.75,
          outputPerMillion: 3.75,
          note: 'Writer list price is Gemini 3.8 Flash through 31 Dec 2026: $0.75 per million tokens in and $3.75 out.'
        }
      : {
          inputPerMillion: 1.5,
          outputPerMillion: 7.5,
          note: 'Writer list price is Gemini 3.8 Flash from 1 Jan 2027: $1.50 per million tokens in and $7.50 out.'
        };
  }
  if (id.includes('2.5-flash') || id.includes('3.5-flash-lite')) {
    return {
      inputPerMillion: 0.3,
      outputPerMillion: 2.5,
      note: 'Writer list price is $0.30 per million tokens in and $2.50 out.'
    };
  }
  if (id.includes('flash')) {
    return {
      inputPerMillion: 0.5,
      outputPerMillion: 3,
      note: 'Writer list price is $0.50 per million tokens in and $3.00 out.'
    };
  }
  return null;
}

export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.ceil(trimmed.length / 4);
}

export function priceTokens(
  model: string,
  inputTokens: number,
  outputTokens: number
): { usd: number | null; note: string | null } {
  if (model.toLowerCase().includes('jev')) {
    return {
      usd: (inputTokens / 1_000_000) * JEV_INPUT_PER_MILLION,
      note: 'Jev is $0.042 per million tokens in. Output is free.'
    };
  }
  const rates = geminiRates(model);
  if (!rates) return { usd: null, note: null };
  const usd =
    (inputTokens / 1_000_000) * rates.inputPerMillion +
    (outputTokens / 1_000_000) * rates.outputPerMillion;
  return { usd, note: rates.note };
}

export function callUsage(input: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  counted: ModelCallUsage['counted'];
}): ModelCallUsage {
  return {
    model: input.model,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    usd: priceTokens(input.model, input.inputTokens, input.outputTokens).usd,
    counted: input.counted
  };
}

export function estimateJevUsage(
  factPack: string,
  draftBody: string | null,
  model: string
): ModelCallUsage {
  return callUsage({
    model,
    inputTokens: estimateTokens(jevBillableText(factPack, draftBody)),
    outputTokens: 0,
    counted: 'estimate'
  });
}

function tokenCount(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatUsd(usd: number): string {
  if (usd === 0) return '$0.00';
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}

export function formatUsageLine(label: string, usage: ModelCallUsage): string {
  const about = usage.counted === 'estimate' ? 'about ' : '';
  const money = usage.usd == null ? 'no list price' : formatUsd(usage.usd);
  return `${label}: ${about}${tokenCount(usage.inputTokens)} tokens in, ${about}${tokenCount(usage.outputTokens)} tokens out, ${about}${money}`;
}
