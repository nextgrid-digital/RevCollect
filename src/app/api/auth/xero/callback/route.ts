import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { emailFromIdToken } from '@/lib/auth/decode-jwt-payload';
import {
  ensureSessionForUserId,
  ensureUserAndSessionCookies
} from '@/lib/auth/create-session-for-email';
import { ingestXeroAr } from '@/lib/canonical/ingest-xero';
import { disconnectOtherBooks } from '@/lib/integrations/disconnect-integration';
import {
  canPersistIntegrations,
  getIntegrationStorageErrorCode,
  mapIntegrationSaveError
} from '@/lib/integrations/integration-storage';
import {
  findTenantKeyByXeroTenantIds,
  saveXeroConnection
} from '@/lib/integrations/xero-connection-store';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';
import {
  exchangeXeroAuthCode,
  fetchXeroConnections,
  getXeroOAuthConfig,
  getXeroSignupRedirectUri
} from '@/lib/integrations/xero-oauth';

const OAUTH_STATE_COOKIE = 'xero_signup_oauth_state';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(request: NextRequest) {
  function redirectHome(error: string) {
    const url = new URL('/', APP_URL);
    url.searchParams.set('error', error);
    return NextResponse.redirect(url);
  }

  const config = getXeroOAuthConfig();
  if (!config) return redirectHome('missing_xero_credentials');
  if (!canPersistIntegrations()) return redirectHome(getIntegrationStorageErrorCode());

  const searchParams = request.nextUrl.searchParams;
  if (searchParams.get('error')) return redirectHome(searchParams.get('error') ?? 'access_denied');

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) return redirectHome('missing_oauth_params');

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);
  if (!expectedState || expectedState !== state) return redirectHome('invalid_oauth_state');

  try {
    const redirectUri = getXeroSignupRedirectUri(config);
    const tokens = await exchangeXeroAuthCode(config, code, redirectUri);
    if (!tokens.refresh_token) return redirectHome('missing_refresh_token');

    const email = emailFromIdToken(tokens.id_token);
    if (!email) return redirectHome('missing_xero_email');

    const connections = await fetchXeroConnections(tokens.access_token);
    if (connections.length === 0) return redirectHome('no_xero_organisation');

    const existing = await findTenantKeyByXeroTenantIds(
      connections.map((connection) => connection.tenantId)
    );
    const organisation =
      connections.find((connection) => connection.tenantId === existing?.xeroTenantId) ??
      connections[0];
    const metadata = { xero_email: email, signup_provider: 'xero' };
    const nextPath = existing ? POST_LOGIN_PATH : '/onboarding/connect-gmail';
    const nextUrl = new URL(nextPath, APP_URL);
    nextUrl.searchParams.set('connected', '1');

    const { response, userId } = existing
      ? await ensureSessionForUserId(existing.tenantKey, metadata, nextUrl)
      : await ensureUserAndSessionCookies(email, metadata, nextUrl);

    await disconnectOtherBooks(userId, 'xero');
    await saveXeroConnection(userId, {
      xeroTenantId: organisation.tenantId,
      organisationName: organisation.tenantName,
      refreshToken: tokens.refresh_token
    });
    try {
      await ingestXeroAr(userId);
    } catch (ingestError) {
      console.error('[auth/xero] ingest failed:', ingestError);
    }

    return response;
  } catch (error) {
    console.error('[auth/xero] signup failed:', error);
    return redirectHome(mapIntegrationSaveError(error));
  }
}
