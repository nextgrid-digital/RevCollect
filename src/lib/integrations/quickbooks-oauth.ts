const AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

export const QUICKBOOKS_OAUTH_SCOPES = [
  'com.intuit.quickbooks.accounting',
  'openid',
  'profile',
  'email'
] as const;

export interface QuickBooksOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export function getQuickBooksOAuthConfig(): QuickBooksOAuthConfig | null {
  const clientId = process.env.INTUIT_CLIENT_ID?.trim() || process.env.QUICKBOOKS_CLIENT_ID?.trim();
  const clientSecret =
    process.env.INTUIT_CLIENT_SECRET?.trim() || process.env.QUICKBOOKS_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const redirectUri = (
    process.env.INTUIT_OAUTH_REDIRECT_URI ?? `${appUrl}/api/integrations/quickbooks/callback`
  ).trim();
  const environment = process.env.INTUIT_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

  return { clientId, clientSecret, redirectUri, environment };
}

export function getQuickBooksSignupRedirectUri(_config: QuickBooksOAuthConfig): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return (process.env.INTUIT_SIGNUP_REDIRECT_URI ?? `${appUrl}/api/auth/intuit/callback`).trim();
}

export function buildQuickBooksAuthUrl(
  config: QuickBooksOAuthConfig,
  state: string,
  redirectUri = config.redirectUri
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: QUICKBOOKS_OAUTH_SCOPES.join(' '),
    redirect_uri: redirectUri,
    state
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
}

function basicAuth(config: QuickBooksOAuthConfig): string {
  return Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
}

export async function exchangeQuickBooksAuthCode(
  config: QuickBooksOAuthConfig,
  code: string,
  redirectUri = config.redirectUri
): Promise<TokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth(config)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });
  if (!response.ok) {
    throw new Error(
      `QuickBooks token exchange failed: ${response.status} ${await response.text()}`
    );
  }
  return response.json() as Promise<TokenResponse>;
}

export async function refreshQuickBooksAccessToken(
  config: QuickBooksOAuthConfig,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth(config)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`QuickBooks token refresh failed: ${response.status} ${detail}`);
    if (detail.includes('invalid_grant')) error.name = 'QuickBooksInvalidGrantError';
    throw error;
  }
  const payload = (await response.json()) as TokenResponse;
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? refreshToken
  };
}

export async function revokeQuickBooksRefreshToken(
  config: QuickBooksOAuthConfig,
  refreshToken: string
): Promise<void> {
  await fetch(REVOKE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth(config)}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ token: refreshToken })
  });
}

export function isQuickBooksInvalidGrantError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('invalid_grant') ||
    (error instanceof Error && error.name === 'QuickBooksInvalidGrantError')
  );
}

export async function fetchQuickBooksCompanyNameWithToken(
  accessToken: string,
  realmId: string,
  environment: 'sandbox' | 'production'
): Promise<string> {
  const base =
    environment === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com';
  const url = new URL(`${base}/v3/company/${realmId}/query`);
  url.searchParams.set('query', 'select CompanyName from CompanyInfo');
  url.searchParams.set('minorversion', '75');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });
  if (!response.ok) return realmId;
  const payload = (await response.json()) as {
    QueryResponse?: { CompanyInfo?: Array<{ CompanyName?: string }> };
  };
  return payload.QueryResponse?.CompanyInfo?.[0]?.CompanyName ?? realmId;
}
