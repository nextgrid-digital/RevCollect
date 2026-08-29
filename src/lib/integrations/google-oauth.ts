const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export const GMAIL_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
] as const;

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ?? `${appUrl}/api/integrations/gmail/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthUrl(config: GoogleOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GMAIL_OAUTH_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export async function exchangeGoogleAuthCode(
  config: GoogleOAuthConfig,
  code: string
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code'
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google token exchange failed: ${response.status} ${detail}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export async function fetchGoogleAccountEmail(accessToken: string): Promise<string> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Google userinfo failed: ${response.status}`);
  }

  const data = (await response.json()) as { email?: string };
  if (!data.email) {
    throw new Error('Google account email missing from userinfo response');
  }

  return data.email;
}

const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

export async function revokeGoogleToken(token: string): Promise<void> {
  const response = await fetch(GOOGLE_REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token })
  });
  if (!response.ok && response.status !== 400) {
    throw new Error(`Google token revocation failed: ${response.status}`);
  }
}
