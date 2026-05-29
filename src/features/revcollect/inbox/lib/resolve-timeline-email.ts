import type { ThreadEmail, TimelineEvent } from '../../types';

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
  const matches = emails.filter((email) => email.author === author);

  if (matches.length !== 1) {
    return undefined;
  }

  return matches[0]!.id;
}
