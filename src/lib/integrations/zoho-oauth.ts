export interface ZohoOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accountsUrl: string;
  apiBase: string;
}

export const ZOHO_OAUTH_SCOPES = [
  'ZohoBooks.invoices.READ',
  'ZohoBooks.contacts.READ',
  'ZohoBooks.customerpayments.READ',
  'AaaServer.profile.Read'
] as const;

export function getZohoOAuthConfig(): ZohoOAuthConfig | null {
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const redirectUri = (
    process.env.ZOHO_OAUTH_REDIRECT_URI ?? `${appUrl}/api/integrations/zoho/callback`
  ).trim();
  const accountsUrl = (process.env.ZOHO_ACCOUNTS_URL ?? 'https://accounts.zoho.com').replace(
    /\/$/,
    ''
  );
  const apiBase = (process.env.ZOHO_API_BASE ?? 'https://www.zohoapis.com/books/v3').replace(
    /\/$/,
    ''
  );

  return { clientId, clientSecret, redirectUri, accountsUrl, apiBase };
}

export function getZohoSignupRedirectUri(_config: ZohoOAuthConfig): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return (process.env.ZOHO_SIGNUP_REDIRECT_URI ?? `${appUrl}/api/auth/zoho/callback`).trim();
}

export function buildZohoAuthUrl(
  config: ZohoOAuthConfig,
  state: string,
  redirectUri = config.redirectUri
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: ZOHO_OAUTH_SCOPES.join(','),
    redirect_uri: redirectUri,
    access_type: 'offline',
    prompt: 'consent',
    state
  });
  return `${config.accountsUrl}/oauth/v2/auth?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  api_domain?: string;
}

export async function exchangeZohoAuthCode(
  config: ZohoOAuthConfig,
  code: string,
  redirectUri = config.redirectUri
): Promise<TokenResponse> {
  const response = await fetch(`${config.accountsUrl}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      code
    })
  });
  if (!response.ok) {
    throw new Error(`Zoho token exchange failed: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<TokenResponse>;
}

export async function refreshZohoAccessToken(
  config: ZohoOAuthConfig,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await fetch(`${config.accountsUrl}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Zoho token refresh failed: ${response.status} ${detail}`);
    if (detail.includes('invalid_code') || detail.includes('INVALID_OAUTH')) {
      error.name = 'ZohoInvalidGrantError';
    }
    throw error;
  }
  const payload = (await response.json()) as TokenResponse;
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? refreshToken
  };
}

export function isZohoInvalidGrantError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZohoInvalidGrantError';
}

export async function fetchZohoOrganizations(
  accessToken: string,
  apiBase: string
): Promise<Array<{ organization_id: string; name: string }>> {
  const response = await fetch(`${apiBase}/organizations`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error(`Zoho organizations failed: ${response.status}`);
  }
  const payload = (await response.json()) as {
    organizations?: Array<{ organization_id: string; name: string }>;
  };
  return payload.organizations ?? [];
}

export async function fetchZohoUserEmail(
  accessToken: string,
  accountsUrl: string
): Promise<string | null> {
  const response = await fetch(`${accountsUrl}/oauth/user/info`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { Email?: string; email?: string };
  return payload.Email ?? payload.email ?? null;
}
