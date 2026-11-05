import type { JevScore } from '@/lib/ai/jev';
import type { DecisionUsage } from '@/lib/ai/model-usage';

export interface DraftEval {
  id: 'facts' | 'language' | 'not_sent' | 'answered_reply';
  pass: boolean;
  detail: string;
}

export interface DecisionTrace {
  id: string;
  customerId: string;
  company: string;
  createdAt: string;
  source: 'playground' | 'overnight';
  factPack: string;
  brief: string | null;
  briefModel: string | null;
  draftBody: string | null;
  draftModel: string | null;
  draftSource: 'gemini' | 'gateway' | 'template' | 'none';
  codeAction: string;
  jevAction: string | null;
  jevModel: string | null;
  scores: JevScore[];
  gate: string | null;
  note: string | null;
  usage?: DecisionUsage | null;
  evals?: DraftEval[];
}
