/** Parse JSON that may include trailing junk after a complete value. */
export function parseJsonBody<T>(text: string): T {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    throw new Error('Empty JSON body');
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch (error) {
    const end = endOfFirstJsonValue(trimmed);
    if (end !== null && end < trimmed.length) {
      try {
        return JSON.parse(trimmed.slice(0, end)) as T;
      } catch {
        // Keep the original parse error.
      }
    }
    throw error;
  }
}

function endOfFirstJsonValue(text: string): number | null {
  const start = text.search(/[\{\[]/);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{' || char === '[') {
      depth += 1;
      continue;
    }
    if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
  }
  return null;
}
