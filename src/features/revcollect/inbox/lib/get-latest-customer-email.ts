import type { ThreadEmail } from '../../types';

export function getLatestCustomerEmail(emails: ThreadEmail[]): ThreadEmail | undefined {
  for (let i = emails.length - 1; i >= 0; i -= 1) {
    if (emails[i]?.author === 'customer') return emails[i];
  }
  return undefined;
}
