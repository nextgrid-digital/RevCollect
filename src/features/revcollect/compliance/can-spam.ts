export const CAN_SPAM_PHYSICAL_ADDRESS = [
  'RevCollect / Nextgrid Digital',
  '548 Market St, PMB 12345',
  'San Francisco, CA 94104',
  'United States'
].join('\n');

export const CAN_SPAM_UNSUBSCRIBE_URL = 'https://revcollect.app/unsubscribe';

export function buildCanSpamFooter(): string {
  return ['---', CAN_SPAM_PHYSICAL_ADDRESS, `Unsubscribe: ${CAN_SPAM_UNSUBSCRIBE_URL}`].join('\n');
}

export function appendCanSpamFooter(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return trimmed;
  const footer = buildCanSpamFooter();
  if (trimmed.includes(CAN_SPAM_UNSUBSCRIBE_URL)) return trimmed;
  return `${trimmed}\n\n${footer}`;
}
