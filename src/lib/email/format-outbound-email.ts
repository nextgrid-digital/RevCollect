const BODY_STYLE =
  "margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#1a1a1a;";

const PARAGRAPH_STYLE = 'margin:1.25em 0 0;';

const FOOTER_STYLE =
  'margin:1.25em 0 0;padding-top:1em;border-top:1px solid #e5e5e5;font-size:13px;line-height:1.45;color:#666;';

/** Collapse stacked breaks and drop a lone markdown rule. Keeps a single newline inside a block. */
export function normalizeOutboundPlainText(body: string): string {
  const lines = body
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '---');
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function linkUnsubscribe(line: string): string {
  const match = line.match(/^(Unsubscribe:\s*)(https?:\/\/\S+)$/i);
  if (!match) return escapeHtml(line);
  const url = match[2];
  return `${escapeHtml(match[1])}<a href="${escapeHtml(url)}" style="color:inherit;font-weight:500;text-decoration:underline;">${escapeHtml(url)}</a>`;
}

function blockHtml(block: string, index: number): string {
  const isFooter = block.split('\n').some((line) => /^Unsubscribe:/i.test(line.trim()));
  const inner = block
    .split('\n')
    .map((line) => linkUnsubscribe(line))
    .join('<br>');
  const style = isFooter ? FOOTER_STYLE : index === 0 ? 'margin:0;' : PARAGRAPH_STYLE;
  return `<p style="${style}">${inner}</p>`;
}

/** HTML Gmail keeps: paragraphs from blank lines, tight breaks from single newlines. */
export function outboundEmailHtml(plain: string): string {
  const blocks = normalizeOutboundPlainText(plain)
    .split(/\n{2,}/)
    .filter((block) => block.trim());
  const paragraphs = blocks.map((block, index) => blockHtml(block, index)).join('');
  return `<!DOCTYPE html><html><body><div style="${BODY_STYLE}">${paragraphs}</div></body></html>`;
}
