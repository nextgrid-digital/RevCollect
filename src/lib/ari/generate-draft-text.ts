import { complete, isAiConfigured } from '@/lib/ai/complete';
import { generateGeminiText, geminiModelId, isGeminiConfigured } from '@/lib/ai/gemini';

export function isDraftModelConfigured(): boolean {
  return isGeminiConfigured() || isAiConfigured();
}

export async function generateDraftText(input: {
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<{
  text: string;
  source: 'gemini' | 'gateway';
  modelId: string;
  inputTokens: number | null;
  outputTokens: number | null;
}> {
  if (isGeminiConfigured()) {
    const generated = await generateGeminiText(input);
    return {
      text: generated.text,
      source: 'gemini',
      modelId: geminiModelId(),
      inputTokens: generated.inputTokens,
      outputTokens: generated.outputTokens
    };
  }

  const generated = await complete({
    taskType: 'generate',
    system: input.system,
    prompt: input.prompt,
    temperature: input.temperature
  });
  if (generated.source !== 'model' || !generated.text) {
    throw new Error('Draft model is not configured');
  }
  return {
    text: generated.text,
    source: 'gateway',
    modelId: process.env.AI_MODEL_GENERATE?.trim() || 'gateway',
    inputTokens: generated.inputTokens ?? null,
    outputTokens: generated.outputTokens ?? null
  };
}
