import { MOCK_TENANT_ID } from '@/features/revcollect/api/types';
import { clearArDataMemo } from '@/lib/canonical/ar-data-memo';
import { clearBooksAr } from '@/lib/canonical/clear-books-ar';
import { withTimeout } from '@/lib/auth-timeout';
import type { BooksProvider } from './books-provider';
import { getGmailRefreshToken, deleteGmailConnection } from './gmail-connection-store';
import { revokeGoogleToken } from './google-oauth';
import { getXeroOAuthConfig, revokeXeroRefreshToken } from './xero-oauth';
import {
  deleteXeroConnection,
  getXeroConnection,
  getXeroRefreshToken
} from './xero-connection-store';
import {
  deleteQuickBooksConnection,
  getQuickBooksConnection,
  getQuickBooksRefreshToken
} from './quickbooks-connection-store';
import { getQuickBooksOAuthConfig, revokeQuickBooksRefreshToken } from './quickbooks-oauth';
import {
  deleteZohoConnection,
  getZohoConnection,
  getZohoRefreshToken
} from './zoho-connection-store';
import { getZohoOAuthConfig, revokeZohoRefreshToken } from './zoho-oauth';

const REVOKE_MS = 4_000;

async function settleRevoke(work: Promise<unknown>, label: string): Promise<void> {
  try {
    await withTimeout(work, REVOKE_MS);
  } catch (error) {
    console.error(`${label} revoke failed:`, error);
  }
}

async function deleteWorkspaceConnection(
  deleteFn: (tenantId: string) => Promise<void>,
  tenantId: string
): Promise<void> {
  await deleteFn(tenantId);
  if (tenantId !== MOCK_TENANT_ID) {
    await deleteFn(MOCK_TENANT_ID);
  }
}

async function hasAnyBooksConnection(tenantId: string): Promise<boolean> {
  const [xero, quickbooks, zoho] = await Promise.all([
    getXeroConnection(tenantId),
    getQuickBooksConnection(tenantId),
    getZohoConnection(tenantId)
  ]);
  return Boolean(xero || quickbooks || zoho);
}

async function clearArIfNoBooks(tenantId: string): Promise<void> {
  if (await hasAnyBooksConnection(tenantId)) return;
  await clearBooksAr(tenantId);
  clearArDataMemo(tenantId);
  if (tenantId !== MOCK_TENANT_ID) {
    await clearBooksAr(MOCK_TENANT_ID);
    clearArDataMemo(MOCK_TENANT_ID);
  }
}

export async function disconnectXero(tenantId: string): Promise<void> {
  const refreshToken = await getXeroRefreshToken(tenantId).catch(() => null);
  const config = getXeroOAuthConfig();
  await deleteWorkspaceConnection(deleteXeroConnection, tenantId);

  if (config && refreshToken) {
    await settleRevoke(revokeXeroRefreshToken(config, refreshToken), '[xero/disconnect]');
  }

  await clearArIfNoBooks(tenantId);
}

export async function disconnectQuickBooks(tenantId: string): Promise<void> {
  const token = await getQuickBooksRefreshToken(tenantId).catch(() => null);
  const config = getQuickBooksOAuthConfig();
  await deleteWorkspaceConnection(deleteQuickBooksConnection, tenantId);
  if (config && token) {
    await settleRevoke(revokeQuickBooksRefreshToken(config, token), '[quickbooks/disconnect]');
  }

  await clearArIfNoBooks(tenantId);
}

export async function disconnectZoho(tenantId: string): Promise<void> {
  const token = await getZohoRefreshToken(tenantId).catch(() => null);
  const config = getZohoOAuthConfig();
  await deleteWorkspaceConnection(deleteZohoConnection, tenantId);
  if (config && token) {
    await settleRevoke(revokeZohoRefreshToken(config, token), '[zoho/disconnect]');
  }

  await clearArIfNoBooks(tenantId);
}

export async function disconnectOtherBooks(tenantId: string, keep: BooksProvider): Promise<void> {
  if (keep !== 'xero') await disconnectXero(tenantId);
  if (keep !== 'quickbooks') await disconnectQuickBooks(tenantId);
  if (keep !== 'zoho') await disconnectZoho(tenantId);
}

export async function disconnectGmail(tenantId: string): Promise<void> {
  const token = await getGmailRefreshToken(tenantId).catch(() => null);
  await deleteWorkspaceConnection(deleteGmailConnection, tenantId);
  if (token) {
    await settleRevoke(revokeGoogleToken(token), '[gmail/disconnect]');
  }
}
