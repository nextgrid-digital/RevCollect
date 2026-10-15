import { getCanonicalStore } from './store';

/**
 * Wipe ledger AR from the canonical snapshot after books disconnect.
 * Preserves agent config, workspace settings, billing, and Gmail sent mail.
 */
export async function clearBooksAr(tenantId: string): Promise<void> {
  const store = await getCanonicalStore();
  const current = await store.read(tenantId);
  await store.write(tenantId, {
    ...current,
    customers: [],
    invoices: [],
    payments: [],
    intelligenceByCustomerId: {},
    drafts: [],
    inboxMessages: [],
    ingestedAt: null
  });
}
