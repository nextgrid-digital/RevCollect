import type { ThreadEmail } from '../types';

const REPLY_PREFIX = /^((re|fwd|fw)\s*:\s*)+/i;

function conversationKey(email: ThreadEmail): string {
  const subject = email.subject.replace(REPLY_PREFIX, '').trim().toLowerCase();
  if (subject) return `subject:${subject}`;
  const gmailThreadId = email.gmailThreadId?.trim();
  if (gmailThreadId) return `gmail:${gmailThreadId}`;
  return `email:${email.id}`;
}

function isLedgerInvoiceEmail(email: ThreadEmail): boolean {
  return email.id.startsWith('ledger-invoice-');
}

/**
 * One action label per email. A conversation is the subject with Re:/Fwd: removed,
 * so replies stay together even when Gmail split them into separate threads.
 * Numbering runs oldest to newest inside that conversation.
 */
export function activityLabelsForEmails(emails: ThreadEmail[]): Map<string, string> {
  const groups = new Map<string, ThreadEmail[]>();
  for (const email of emails) {
    const key = conversationKey(email);
    const group = groups.get(key);
    if (group) group.push(email);
    else groups.set(key, [email]);
  }

  const labels = new Map<string, string>();
  for (const group of groups.values()) {
    const ordered = group.toSorted((left, right) => left.sentAt.localeCompare(right.sentAt));
    let sentInvoice = false;
    let followUp = 0;

    for (const email of ordered) {
      if (email.author !== 'agent') {
        labels.set(email.id, 'Customer responded');
        continue;
      }
      if (isLedgerInvoiceEmail(email)) {
        labels.set(email.id, 'Invoice sent');
        continue;
      }
      if (!sentInvoice) {
        labels.set(email.id, 'Invoice sent');
        sentInvoice = true;
        continue;
      }
      followUp += 1;
      labels.set(email.id, `Follow-up ${followUp}`);
    }
  }

  return labels;
}
