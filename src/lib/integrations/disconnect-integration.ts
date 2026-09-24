import { MOCK_TENANT_ID } from '@/features/revcollect/api/types';
import type { BooksProvider } from './books-provider';
import { withTimeout } from '@/lib/auth-timeout';
import { getGmailRefreshToken, deleteGmailConnection } from './gmail-connection-store';
import { revokeGoogleToken } from './google-oauth';
import { getXeroOAuthConfig, revokeXeroRefreshToken } from './xero-oauth';
import { deleteXeroConnection, getXeroRefreshToken } from './xero-connection-store';
import {
  deleteQuickBooksConnection,
  getQuickBooksRefreshToken
} from './quickbooks-connection-store';
import { getQuickBooksOAuthConfig, revokeQuickBooksRefreshToken } from './quickbooks-oauth';
import { deleteZohoConnection, getZohoRefreshToken } from './zoho-connection-store';
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

export async function disconnectXero(tenantId: string): Promise<void> {
  const refreshToken = await getXeroRefreshToken(tenantId).catch(() => null);
  const config = getXeroOAuthConfig();
  await deleteWorkspaceConnection(deleteXeroConnection, tenantId);

  if (config && refreshToken) {
    await settleRevoke(revokeXeroRefreshToken(config, refreshToken), '[xero/disconnect]');
  }
}

export async function disconnectQuickBooks(tenantId: string): Promise<void> {
  const token = await getQuickBooksRefreshToken(tenantId).catch(() => null);
  const config = getQuickBooksOAuthConfig();
  await deleteWorkspaceConnection(deleteQuickBooksConnection, tenantId);
  if (config && token) {
    await settleRevoke(revokeQuickBooksRefreshToken(config, token), '[quickbooks/disconnect]');
  }
}

export async function disconnectZoho(tenantId: string): Promise<void> {
  const token = await getZohoRefreshToken(tenantId).catch(() => null);
  const config = getZohoOAuthConfig();
  await deleteWorkspaceConnection(deleteZohoConnection, tenantId);
  if (config && token) {
    await settleRevoke(revokeZohoRefreshToken(config, token), '[zoho/disconnect]');
  }
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
