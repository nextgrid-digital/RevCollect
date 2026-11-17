import { normalizeOutboundPlainText } from '@/lib/email/format-outbound-email';

export const COLLECTION_SEND_NOTE =
  'You are the sender. Mail goes out from your connected Gmail, using the sender name and reply-to in Settings.';

/** @deprecated Use COLLECTION_SEND_NOTE. Collection mail does not include an unsubscribe link. */
export const CAN_SPAM_SEND_NOTE = COLLECTION_SEND_NOTE;

const LEGACY_UNSUBSCRIBE_URL = 'https://revcollect.app/unsubscribe';
const LEGACY_VENDOR_LINES = new Set([
  'RevCollect / Nextgrid Digital',
  '548 Market St, PMB 12345',
  'San Francisco, CA 94104',
  'United States'
]);

export function stripLegacyCollectionFooter(body: string): string {
  const lines = body.split('\n').filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (trimmed.includes(LEGACY_UNSUBSCRIBE_URL)) return false;
    if (/^unsubscribe:/i.test(trimmed)) return false;
    if (LEGACY_VENDOR_LINES.has(trimmed)) return false;
    return true;
  });
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Keep the workspace signature. Do not append a vendor address or unsubscribe link. */
export function prepareCollectionBody(body: string, signature?: string): string {
  const trimmed = stripLegacyCollectionFooter(normalizeOutboundPlainText(body));
  const sig = signature?.trim();
  if (!sig || trimmed.endsWith(sig)) return trimmed;
  return trimmed ? `${trimmed}\n\n${sig}` : sig;
}
