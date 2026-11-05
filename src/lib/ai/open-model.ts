export function openModelId(): string | null {
  const name = process.env.OPEN_MODEL_NAME?.trim();
  const base = process.env.OPEN_MODEL_BASE_URL?.trim();
  if (!name || !base) return null;
  return name;
}

export async function compressWithOpenModel(text: string): Promise<string | null> {
  const model = openModelId();
  const base = process.env.OPEN_MODEL_BASE_URL?.trim();
  if (!model || !base || text.length < 1200) return null;

  const apiKey = process.env.OPEN_MODEL_API_KEY?.trim() || 'ollama';
  const response = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Compress the collections fact pack into a short brief. Keep only facts that are already written. Do not add invoice numbers, amounts, dates, or names.'
        },
        { role: 'user', content: text }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Open model request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const brief = payload.choices?.[0]?.message?.content?.trim() ?? '';
  return brief || null;
}
