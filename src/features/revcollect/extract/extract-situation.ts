import { complete, parseJsonObject } from '@/lib/ai/complete';
import { emptyIntelligence } from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { CustomerSituation } from '@/lib/canonical/types';

export type ExtractEventKind = 'reply' | 'payment' | 'draft_edit';

export interface ExtractSituationInput {
  tenantId: string;
  customerId: string;
  kind: ExtractEventKind;
  text: string;
}

interface ExtractedPayload {
  flag: string;
  detail?: string;
  evidence: string;
  confidence: number;
  expiresDays: number;
}

const EXTRACT_SCHEMA = {
  type: 'object',
  required: ['flag', 'evidence', 'confidence', 'expiresDays'],
  properties: {
    flag: { type: 'string' },
    detail: { type: 'string' },
    evidence: { type: 'string' },
    confidence: { type: 'number' },
    expiresDays: { type: 'number' }
  }
};

function defaultExpiryDays(kind: ExtractEventKind): number {
  switch (kind) {
    case 'payment':
      return 14;
    case 'reply':
      return 21;
    case 'draft_edit':
      return 90;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function heuristicExtract(kind: ExtractEventKind, text: string): ExtractedPayload | null {
  const lower = text.toLowerCase();
  if (kind === 'payment' || /paid|payment|remittance/.test(lower)) {
    return {
      flag: 'recent_payment',
      evidence: text.slice(0, 180),
      confidence: 0.7,
      expiresDays: defaultExpiryDays('payment')
    };
  }
  if (/legal|attorney|lawyer/.test(lower)) {
    return {
      flag: 'legal_hold',
      evidence: text.slice(0, 180),
      confidence: 0.8,
      expiresDays: 30
    };
  }
  if (/dispute|discrepancy|incorrect/.test(lower)) {
    return {
      flag: 'dispute',
      evidence: text.slice(0, 180),
      confidence: 0.7,
      expiresDays: 21
    };
  }
  if (/promise|will pay|by friday|next week/.test(lower)) {
    return {
      flag: 'promise_to_pay',
      evidence: text.slice(0, 180),
      confidence: 0.65,
      expiresDays: 14
    };
  }
  if (kind === 'draft_edit') return null;
  return {
    flag: `${kind}_event`,
    evidence: text.slice(0, 180),
    confidence: 0.4,
    expiresDays: defaultExpiryDays(kind)
  };
}

export async function extractSituation(
  input: ExtractSituationInput
): Promise<CustomerSituation | null> {
  const { tenantId, customerId, kind, text } = input;
  if (!text.trim()) return null;

  let payload = heuristicExtract(kind, text);
  const result = await complete({
    taskType: 'extract',
    prompt: `Extract a collections situation from this ${kind} event. Text:\n${text}`,
    schema: EXTRACT_SCHEMA
  });
  if (result.source === 'model') {
    const parsed = parseJsonObject<ExtractedPayload>(result.text);
    if (parsed?.flag && parsed.evidence) {
      payload = parsed;
    }
  }
  if (!payload) return null;

  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + (payload.expiresDays || defaultExpiryDays(kind)));
  const situation: CustomerSituation = {
    flag: payload.flag,
    detail: payload.detail,
    evidence: payload.evidence,
    confidence: payload.confidence,
    created: new Date().toISOString(),
    expires: expires.toISOString(),
    status: 'active'
  };

  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const current = snapshot.intelligenceByCustomerId[customerId] ?? emptyIntelligence();
  snapshot.intelligenceByCustomerId[customerId] = {
    ...current,
    situations: [...current.situations.filter((item) => item.status === 'active'), situation]
  };
  await store.write(tenantId, snapshot);
  return situation;
}
