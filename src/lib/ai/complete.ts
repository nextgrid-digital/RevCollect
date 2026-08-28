export type AiTaskType = 'generate' | 'extract' | 'classify';

export interface CompleteInput<TSchema> {
  taskType: AiTaskType;
  prompt: string;
  system?: string;
  schema?: TSchema;
  temperature?: number;
}

export interface CompleteResult {
  text: string;
  source: 'model' | 'template';
}

interface GatewayConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

function modelForTask(taskType: AiTaskType): string {
  if (taskType === 'extract') {
    return (
      process.env.AI_MODEL_EXTRACT?.trim() ||
      process.env.AI_MODEL_GENERATE?.trim() ||
      'gpt-4.1-mini'
    );
  }
  if (taskType === 'classify') {
    return (
      process.env.AI_MODEL_CLASSIFY?.trim() ||
      process.env.AI_MODEL_GENERATE?.trim() ||
      'gpt-4.1-mini'
    );
  }
  return process.env.AI_MODEL_GENERATE?.trim() || 'gpt-4.1-mini';
}

export function getAiGatewayConfig(taskType: AiTaskType = 'generate'): GatewayConfig | null {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (gatewayKey) {
    return {
      baseUrl: process.env.AI_GATEWAY_BASE_URL?.trim() || 'https://ai-gateway.vercel.sh/v1',
      apiKey: gatewayKey,
      model: modelForTask(taskType)
    };
  }

  const apiKey = process.env.AI_API_KEY?.trim();
  const baseUrl = process.env.AI_BASE_URL?.trim();
  if (apiKey && baseUrl) {
    return {
      baseUrl: baseUrl.replace(/\/$/, ''),
      apiKey,
      model: modelForTask(taskType)
    };
  }

  return null;
}

export function isAiConfigured(): boolean {
  return getAiGatewayConfig() !== null;
}

function schemaHint(schema: unknown): string {
  if (!schema) return '';
  return `\nRespond with JSON matching this schema:\n${JSON.stringify(schema, null, 2)}`;
}

export async function complete(input: CompleteInput<unknown>): Promise<CompleteResult> {
  const config = getAiGatewayConfig(input.taskType);
  if (!config) {
    return { text: '', source: 'template' };
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      temperature: input.temperature ?? (input.taskType === 'generate' ? 0.3 : 0),
      messages: [
        {
          role: 'system',
          content:
            input.system ??
            'Use ONLY the data provided. Do not invent numbers, amounts, dates, or names.'
        },
        {
          role: 'user',
          content: `${input.prompt}${schemaHint(input.schema)}`
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI gateway failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim() ?? '';
  return { text, source: 'model' };
}

export function parseJsonObject<T>(text: string): T | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
