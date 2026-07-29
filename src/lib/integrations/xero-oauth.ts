const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize';
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections';

/** Granular scopes for collections (apps created after March 2026). */
export const XERO_OAUTH_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'accounting.contacts',
  'accounting.invoices',
  'accounting.payments',
  'accounting.reports.aged.read'
] as const;

export interface XeroOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function getXeroOAuthConfig(): XeroOAuthConfig | null {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectUri =
    process.env.XERO_OAUTH_REDIRECT_URI ?? `${appUrl}/api/integrations/xero/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function buildXeroAuthUrl(config: XeroOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: XERO_OAUTH_SCOPES.join(' '),
    state
  });

  return `${XERO_AUTH_URL}?${params.toString()}`;
}

interface XeroTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  id_token?: string;
}

function getBasicAuthHeader(config: XeroOAuthConfig): string {
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function exchangeXeroAuthCode(
  config: XeroOAuthConfig,
  code: string
): Promise<XeroTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri
  });

  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: getBasicAuthHeader(config),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Xero token exchange failed: ${response.status} ${detail}`);
  }

  return response.json() as Promise<XeroTokenResponse>;
}

export interface XeroConnection {
  id: string;
  tenantId: string;
  tenantType: string;
  tenantName: string;
  createdDateUtc: string;
}

export async function fetchXeroConnections(accessToken: string): Promise<XeroConnection[]> {
  const response = await fetch(XERO_CONNECTIONS_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Xero connections failed: ${response.status}`);
  }

  return response.json() as Promise<XeroConnection[]>;
}

export interface XeroRefreshedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function isXeroInvalidGrantError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('invalid_grant') || message.includes('Refresh token has been consumed');
}

export async function refreshXeroAccessToken(
  config: XeroOAuthConfig,
  refreshToken: string
): Promise<XeroRefreshedTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: getBasicAuthHeader(config),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Xero token refresh failed: ${response.status} ${detail}`);
    if (isXeroInvalidGrantError(error)) {
      error.name = 'XeroInvalidGrantError';
    }
    throw error;
  }

  const payload = (await response.json()) as XeroTokenResponse;
  if (!payload.access_token) {
    throw new Error('Xero token refresh did not return an access token');
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? refreshToken,
    expiresIn: payload.expires_in
  };
}
