import { randomUUID } from 'crypto';
import { evaluateWithJev, isJevConfigured, jevModelId } from '@/lib/ai/jev';
import { jevReviewState } from '@/lib/ai/jev-request';
import { callUsage, type ModelCallUsage } from '@/lib/ai/model-usage';
import { compressWithOpenModel, openModelId } from '@/lib/ai/open-model';
import { validateQueuedDraft } from '@/lib/ai/validators';
import type { DraftFacts } from '@/lib/ai/validators';
import type { DecisionTrace } from '@/lib/ari/decision-trace-types';

export async function explainDecision(input: {
  customerId: string;
  company: string;
  source: DecisionTrace['source'];
  factPack: string;
  facts: DraftFacts;
  draftBody: string | null;
  draftSource: DecisionTrace['draftSource'];
  draftModel: string | null;
  codeAction: string;
  gate: string | null;
  language: { allowLegalLanguage: boolean; allowLateFeeMentions: boolean };
  writerUsage?: ModelCallUsage | null;
}): Promise<DecisionTrace> {
  let brief: string | null = null;
  let briefModel: string | null = null;
  if (openModelId()) {
    try {
      const compressed = await compressWithOpenModel(input.factPack);
      if (compressed) {
        const validation = validateQueuedDraft(compressed, input.facts, input.language);
        if (validation.ok) {
          brief = compressed;
          briefModel = openModelId();
        }
      }
    } catch (error) {
      console.error(
        '[explainDecision] open model failed',
        error instanceof Error ? error.name : 'request failed'
      );
    }
  }

  let scores: DecisionTrace['scores'] = [];
  let jevAction: string | null = null;
  let jevModel: string | null = null;
  let jevUsage: ModelCallUsage | null = null;
  if (isJevConfigured()) {
    try {
      const evaluated = await evaluateWithJev(jevReviewState(input.factPack, input.draftBody));
      scores = evaluated.scores;
      jevAction = evaluated.action;
      jevModel = evaluated.modelId;
      if (evaluated.inputTokens != null) {
        jevUsage = callUsage({
          model: evaluated.modelId,
          inputTokens: evaluated.inputTokens,
          outputTokens: evaluated.outputTokens ?? 0,
          counted: 'provider'
        });
      }
    } catch (error) {
      console.error(
        '[explainDecision] jev failed',
        error instanceof Error ? error.name : 'request failed'
      );
      jevModel = jevModelId();
    }
  }

  return {
    id: randomUUID(),
    customerId: input.customerId,
    company: input.company,
    createdAt: new Date().toISOString(),
    source: input.source,
    factPack: input.factPack,
    brief,
    briefModel,
    draftBody: input.draftBody,
    draftModel: input.draftModel,
    draftSource: input.draftSource,
    codeAction: input.codeAction,
    jevAction,
    jevModel,
    scores,
    gate: input.gate,
    note: null,
    usage: {
      writer: input.writerUsage ?? null,
      jev: jevUsage
    }
  };
}
