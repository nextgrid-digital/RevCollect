const ON_WROTE_LINE = /^on .+wrote:\s*$/i;
const ON_LINE_START =
  /^on (mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d)/i;
const ORIGINAL_MESSAGE = /^-{2,}\s*original message\s*-{2,}$/i;
const OUTLOOK_DIVIDER = /^_{5,}$/;

function isOnWroteHeader(lines: string[], index: number): boolean {
  const line = lines[index]?.trim() ?? '';
  if (ON_WROTE_LINE.test(line)) return true;
  if (!ON_LINE_START.test(line)) return false;
  return lines.slice(index, index + 4).some((part) => /wrote:\s*$/i.test(part.trim()));
}

export function stripQuotedReply(body: string): string {
  const normalized = body.replace(/\r\n/g, '\n').replace(/[\u00a0\u202f\u2007\u2009]/g, ' ');
  const lines = normalized.split('\n');
  let cutAt = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (
      isOnWroteHeader(lines, index) ||
      ORIGINAL_MESSAGE.test(trimmed) ||
      OUTLOOK_DIVIDER.test(trimmed)
    ) {
      cutAt = index;
      break;
    }
    if (trimmed.startsWith('>') && lines.slice(0, index).some((line) => line.trim())) {
      cutAt = index;
      break;
    }
  }

  const kept = (cutAt === -1 ? lines : lines.slice(0, cutAt)).join('\n').trim();
  return kept || normalized.trim();
}
