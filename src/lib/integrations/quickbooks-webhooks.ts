import { createHmac, timingSafeEqual } from 'crypto';
import { clearArDataMemo } from '@/lib/canonical/ar-data-memo';
import { ingestQuickBooksAr } from '@/lib/canonical/ingest-quickbooks';
import {
  getQuickBooksConnection,
  type QuickBooksConnectionRecord
} from './quickbooks-connection-store';
import { listProviderTenantKeys } from './integration-secret-store';

const AR_ENTITY_NAMES = new Set([
  'Customer',
  'Invoice',
  'Payment',
  'CreditMemo',
  'RefundReceipt',
  'SalesReceipt'
]);

export function getQuickBooksWebhookVerifierToken(): string | null {
  const production = process.env.INTUIT_WEBHOOK_VERIFIER_TOKEN?.trim();
  const sandbox = process.env.INTUIT_WEBHOOK_VERIFIER_TOKEN_SANDBOX?.trim();
  const environment = process.env.INTUIT_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
  if (environment === 'production') return production || null;
  return sandbox || production || null;
}

/** HMAC-SHA256(body, verifier) base64 — must match `intuit-signature`. */
export function verifyQuickBooksWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  verifierToken: string
): boolean {
  if (!signatureHeader) return false;
  try {
    const digest = createHmac('sha256', verifierToken).update(rawBody, 'utf8').digest('base64');
    const expected = Buffer.from(digest);
    const received = Buffer.from(signatureHeader);
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

function realmIdsFromCloudEvents(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];
  const realms = new Set<string>();
  for (const event of payload) {
    if (!event || typeof event !== 'object') continue;
    const row = event as {
      intuitaccountid?: string;
      type?: string;
    };
    if (!row.intuitaccountid) continue;
    const type = (row.type ?? '').toLowerCase();
    const isArRelevant =
      !type ||
      type.includes('customer') ||
      type.includes('invoice') ||
      type.includes('payment') ||
      type.includes('creditmemo') ||
      type.includes('refund') ||
      type.includes('salesreceipt');
    if (isArRelevant) realms.add(String(row.intuitaccountid));
  }
  return [...realms];
}

function realmIdsFromClassicPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const notifications = (payload as { eventNotifications?: unknown }).eventNotifications;
  if (!Array.isArray(notifications)) return [];
  const realms = new Set<string>();
  for (const note of notifications) {
    if (!note || typeof note !== 'object') continue;
    const realmId = (note as { realmId?: string }).realmId;
    if (!realmId) continue;
    const entities = (
      note as {
        dataChangeEvent?: { entities?: Array<{ name?: string }> };
      }
    ).dataChangeEvent?.entities;
    if (!Array.isArray(entities) || entities.length === 0) {
      realms.add(realmId);
      continue;
    }
    const relevant = entities.some((entity) => AR_ENTITY_NAMES.has(String(entity.name ?? '')));
    if (relevant) realms.add(realmId);
  }
  return [...realms];
}

export function extractQuickBooksWebhookRealmIds(payload: unknown): string[] {
  const fromCloud = realmIdsFromCloudEvents(payload);
  if (fromCloud.length > 0) return fromCloud;
  return realmIdsFromClassicPayload(payload);
}

export async function findTenantIdsByQuickBooksRealmId(realmId: string): Promise<string[]> {
  const keys = await listProviderTenantKeys('quickbooks');
  const matches: string[] = [];
  await Promise.all(
    keys.map(async (tenantId) => {
      const connection = await getQuickBooksConnection(tenantId);
      if (connection?.realmId === realmId) matches.push(tenantId);
    })
  );
  return matches;
}

export async function processQuickBooksWebhookRealms(realmIds: string[]): Promise<void> {
  const uniqueRealms = [...new Set(realmIds.filter(Boolean))];
  for (const realmId of uniqueRealms) {
    const tenantIds = await findTenantIdsByQuickBooksRealmId(realmId);
    for (const tenantId of tenantIds) {
      try {
        await ingestQuickBooksAr(tenantId);
        clearArDataMemo(tenantId);
      } catch (error) {
        console.error('[quickbooks/webhooks] ingest failed', { tenantId, realmId, error });
      }
    }
  }
}

export type { QuickBooksConnectionRecord };
