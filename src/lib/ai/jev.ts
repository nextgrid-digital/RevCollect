import { JEV_QUESTIONS } from '@/lib/ai/jev-request';

export interface JevScore {
  id: string;
  label: string;
  kind: 'choice' | 'noul' | 'score';
  value: string;
  confidence: number | null;
}

interface JevAnswer {
  type?: string;
  choice?: string;
  noul?: number;
  score?: number;
  confidence?: number;
}

const LABELS: Record<string, string> = {
  action: 'Next action',
  dispute: 'Active dispute',
  promise: 'Promise to pay',
  human_review: 'Needs a person'
};

export function jevModelId(): string {
  return process.env.TYPESAFE_MODEL?.trim() || 'jev-1.14.0';
}

export function isJevConfigured(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY?.trim());
}

function formatAnswer(id: string, answer: JevAnswer): JevScore {
  if (answer.type === 'choice' || answer.choice) {
    return {
      id,
      label: LABELS[id] ?? id,
      kind: 'choice',
      value: answer.choice ?? 'unknown',
      confidence: typeof answer.confidence === 'number' ? answer.confidence : null
    };
  }
  if (answer.type === 'score' || typeof answer.score === 'number') {
    return {
      id,
      label: LABELS[id] ?? id,
      kind: 'score',
      value: typeof answer.score === 'number' ? answer.score.toFixed(2) : 'unknown',
      confidence: typeof answer.confidence === 'number' ? answer.confidence : null
    };
  }
  const noul = typeof answer.noul === 'number' ? answer.noul : 0;
  return {
    id,
    label: LABELS[id] ?? id,
    kind: 'noul',
    value: `${Math.round(noul * 100)}%`,
    confidence: noul
  };
}

export async function evaluateWithJev(state: string): Promise<{
  modelId: string;
  action: string | null;
  scores: JevScore[];
  inputTokens: number | null;
  outputTokens: number | null;
}> {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) {
    return {
      modelId: jevModelId(),
      action: null,
      scores: [],
      inputTokens: null,
      outputTokens: null
    };
  }

  const model = jevModelId();
  const base = (process.env.TYPESAFE_BASE_URL?.trim() || 'https://api.typesafe.ai').replace(
    /\/$/,
    ''
  );
  const response = await fetch(`${base}/v1/systemone`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      model,
      state,
      questions: JEV_QUESTIONS
    })
  });

  if (!response.ok) {
    throw new Error(`Jev request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    model?: string;
    answers?: Record<string, JevAnswer>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const answers = payload.answers ?? {};
  const scores = Object.entries(answers).map(([id, answer]) => formatAnswer(id, answer));
  const action = answers.action?.choice ?? null;
  const inputTokens =
    typeof payload.usage?.input_tokens === 'number' ? payload.usage.input_tokens : null;
  const outputTokens =
    typeof payload.usage?.output_tokens === 'number' ? payload.usage.output_tokens : null;
  return { modelId: payload.model || model, action, scores, inputTokens, outputTokens };
}
