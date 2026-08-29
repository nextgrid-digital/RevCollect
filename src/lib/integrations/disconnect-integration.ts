import { getGmailRefreshToken, deleteGmailConnection } from './gmail-connection-store';
import { revokeGoogleToken } from './google-oauth';
import {
  deleteXeroApiConnection,
  fetchXeroConnections,
  getXeroOAuthConfig,
  revokeXeroRefreshToken
} from './xero-oauth';
import { getXeroAccessContext } from './xero-api';
import { deleteXeroConnection, getXeroRefreshToken } from './xero-connection-store';

export async function disconnectXero(tenantId: string): Promise<void> {
  try {
    const refreshToken = await getXeroRefreshToken(tenantId);
    const config = getXeroOAuthConfig();
    const context = await getXeroAccessContext(tenantId);
    const connections = await fetchXeroConnections(context.accessToken);
    const match = connections.find((connection) => connection.tenantId === context.xeroTenantId);
    if (match) {
      await deleteXeroApiConnection(context.accessToken, match.id);
    }
    if (config && refreshToken) {
      await revokeXeroRefreshToken(config, refreshToken);
    }
  } catch (error) {
    console.error('[xero/disconnect] revoke failed:', error);
  }

  await deleteXeroConnection(tenantId);
}

export async function disconnectGmail(tenantId: string): Promise<void> {
  try {
    const token = await getGmailRefreshToken(tenantId);
    if (token) {
      await revokeGoogleToken(token);
    }
  } catch (error) {
    console.error('[gmail/disconnect] revoke failed:', error);
  }

  await deleteGmailConnection(tenantId);
}
