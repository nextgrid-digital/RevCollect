import type { Customer, InboxMessage } from '../../types';
import { policyFromCustomer } from '../../lib/relationship-policy';

function isSameLocalDay(iso: string, now = new Date()): boolean {
  const day = iso.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso) || /^\d{4}-\d{2}-\d{2}T00:00:00/.test(iso)) {
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return day === today;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function otherOpenAccountsForEmail(
  customers: Customer[],
  customerId: string,
  recipientEmail: string
): Customer[] {
  const email = recipientEmail.trim().toLowerCase();
  if (!email) return [];
  return customers.filter((item) => {
    if (item.id === customerId || item.balanceCents <= 0) return false;
    const other = (policyFromCustomer(item).preferredEmail ?? item.email).trim().toLowerCase();
    return other === email;
  });
}

/** Second send to an address already emailed today needs an explicit confirm. */
export function confirmSameDayRecipientSend(input: {
  company: string;
  customerId: string;
  recipientEmail: string;
  customers: Customer[];
  inboxMessages: InboxMessage[];
}): boolean {
  const email = input.recipientEmail.trim().toLowerCase();
  if (!email || typeof window === 'undefined') return true;
  const others = otherOpenAccountsForEmail(input.customers, input.customerId, email);
  const accountIds = new Set([input.customerId, ...others.map((item) => item.id)]);
  const sentToday = input.inboxMessages.some(
    (message) =>
      accountIds.has(message.customerId) &&
      message.outboundSent &&
      isSameLocalDay(message.receivedAt)
  );
  if (!sentToday) return true;
  const listed = others.map((item) => item.company).join(', ');
  const otherLine = listed
    ? `Other open accounts on this address: ${listed}.`
    : 'No other open account shares this address.';
  return window.confirm(
    `You already emailed ${email} today. ${otherLine} Send another email for ${input.company}?`
  );
}
