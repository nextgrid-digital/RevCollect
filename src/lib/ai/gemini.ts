const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export function geminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function generateGeminiText(input: {
  system: string;
  prompt: string;
  temperature?: number;
  json?: boolean;
  model?: string;
  timeoutMs?: number;
}): Promise<{ text: string; inputTokens: number | null; outputTokens: number | null }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = input.model?.trim() || geminiModelId();
  const response = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey
    },
    signal: AbortSignal.timeout(input.timeoutMs ?? 20_000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: input.system }] },
      contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
      generationConfig: {
        temperature: input.temperature ?? 0.3,
        ...(input.json ? { responseMimeType: 'application/json' } : {})
      }
    })
  });

  if (!response.ok) {
    console.error('[gemini] request failed', response.status);
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      thoughtsTokenCount?: number;
    };
  };
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const spoken = parts.filter((part) => !part.thought);
  const text = (spoken.length > 0 ? spoken : parts)
    .map((part) => part.text ?? '')
    .join('')
    .trim();
  if (!text) {
    throw new Error('Gemini returned an empty draft');
  }
  const usage = payload.usageMetadata;
  const inputTokens = typeof usage?.promptTokenCount === 'number' ? usage.promptTokenCount : null;
  const candidates =
    typeof usage?.candidatesTokenCount === 'number' ? usage.candidatesTokenCount : 0;
  const thoughts = typeof usage?.thoughtsTokenCount === 'number' ? usage.thoughtsTokenCount : 0;
  const outputTokens = usage ? candidates + thoughts : null;
  return { text, inputTokens, outputTokens };
}
