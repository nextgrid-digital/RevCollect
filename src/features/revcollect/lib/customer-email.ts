const PLACEHOLDER_EMAIL = 'no-email@xero.local';

/** True when the address looks deliverable (not a ledger / sandbox placeholder). */
export function isDeliverableCustomerEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return false;
  if (normalized === PLACEHOLDER_EMAIL) return false;
  if (/^no-?email@/.test(normalized)) return false;
  if (
    normalized.endsWith('.local') ||
    normalized.endsWith('@ledger.local') ||
    normalized.endsWith('@xero.local') ||
    normalized.endsWith('@accounting.local') ||
    normalized.endsWith('@quickbooks.local')
  ) {
    return false;
  }
  return true;
}

export function isPlaceholderCustomerEmail(email: string | null | undefined): boolean {
  return !isDeliverableCustomerEmail(email);
}
