import { complete, parseJsonObject } from '@/lib/ai/complete';

export type ReplyIntentClass =
  | 'deflection'
  | 'promise'
  | 'dispute'
  | 'payment_confirmation'
  | 'other';

const CLASSIFY_SCHEMA = {
  type: 'object',
  required: ['intent', 'label'],
  properties: {
    intent: {
      type: 'string',
      enum: ['deflection', 'promise', 'dispute', 'payment_confirmation', 'other']
    },
    label: { type: 'string' }
  }
};

const PROMISE_DATE_SCHEMA = {
  type: 'object',
  required: ['promiseDate'],
  properties: {
    promiseDate: { type: ['string', 'null'] },
    confidence: { type: 'number' }
  }
};

function heuristicIntent(text: string): { intent: ReplyIntentClass; label: string } {
  const lower = text.toLowerCase();
  if (/paid|payment sent|remittance/.test(lower)) {
    return { intent: 'payment_confirmation', label: 'Payment confirmation' };
  }
  if (/dispute|incorrect|not our invoice/.test(lower)) {
    return { intent: 'dispute', label: 'Dispute' };
  }
  if (/will pay|promise|by friday|next week/.test(lower)) {
    return { intent: 'promise', label: 'Promise to pay' };
  }
  if (/out of office|forwarded|wrong person/.test(lower)) {
    return { intent: 'deflection', label: 'Deflection' };
  }
  return { intent: 'other', label: 'Unclassified reply' };
}

export async function classifyReply(
  text: string
): Promise<{ intent: ReplyIntentClass; label: string }> {
  const fallback = heuristicIntent(text);
  const result = await complete({
    taskType: 'classify',
    prompt: `Classify this customer collections reply.\n${text}`,
    schema: CLASSIFY_SCHEMA
  });
  if (result.source !== 'model') return fallback;
  const parsed = parseJsonObject<{ intent: ReplyIntentClass; label: string }>(result.text);
  if (!parsed?.intent) return fallback;
  return { intent: parsed.intent, label: parsed.label || fallback.label };
}

export async function extractPromiseDate(
  text: string
): Promise<{ promiseDate: string | null; confidence: number }> {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1] ?? null;
  const result = await complete({
    taskType: 'extract',
    prompt: `Extract a promised payment date as YYYY-MM-DD or null.\n${text}`,
    schema: PROMISE_DATE_SCHEMA
  });
  if (result.source !== 'model') {
    return { promiseDate: iso, confidence: iso ? 0.5 : 0 };
  }
  const parsed = parseJsonObject<{ promiseDate: string | null; confidence?: number }>(result.text);
  return {
    promiseDate: parsed?.promiseDate ?? iso,
    confidence: parsed?.confidence ?? (parsed?.promiseDate ? 0.7 : 0)
  };
}
