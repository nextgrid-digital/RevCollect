import type { ThreadEmail, TimelineEvent } from '../../types';

const MAX_MATCH_MS = 7 * 24 * 60 * 60 * 1000;

export function resolveTimelineThreadEmailId(
  event: TimelineEvent,
  emails: ThreadEmail[]
): string | undefined {
  if (event.threadEmailId) {
    return emails.some((email) => email.id === event.threadEmailId)
      ? event.threadEmailId
      : undefined;
  }

  if (event.type !== 'email_sent' && event.type !== 'email_received') {
    return undefined;
  }

  const author = event.type === 'email_sent' ? 'agent' : 'customer';
  const eventTime = new Date(event.occurredAt).getTime();

  let bestEmail: ThreadEmail | undefined;
  let bestDelta = Infinity;

  for (const email of emails) {
    if (email.author !== author) continue;
    const delta = Math.abs(new Date(email.sentAt).getTime() - eventTime);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestEmail = email;
    }
  }

  if (!bestEmail || bestDelta > MAX_MATCH_MS) {
    return undefined;
  }

  return bestEmail.id;
}
