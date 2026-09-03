import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { emailFromIdToken } from '@/lib/auth/decode-jwt-payload';
import { ensureUserAndSessionCookies } from '@/lib/auth/create-session-for-email';
import { ingestQuickBooksAr } from '@/lib/canonical/ingest-quickbooks';
import { disconnectOtherBooks } from '@/lib/integrations/disconnect-integration';
import {
  canPersistIntegrations,
  getIntegrationStorageErrorCode,
  mapIntegrationSaveError
} from '@/lib/integrations/integration-storage';
import { saveQuickBooksConnection } from '@/lib/integrations/quickbooks-connection-store';
import {
  exchangeQuickBooksAuthCode,
  fetchQuickBooksCompanyNameWithToken,
  getQuickBooksOAuthConfig,
  getQuickBooksSignupRedirectUri
} from '@/lib/integrations/quickbooks-oauth';

const OAUTH_STATE_COOKIE = 'intuit_signup_oauth_state';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(request: NextRequest) {
  function redirectHome(error: string) {
    const url = new URL('/', APP_URL);
    url.searchParams.set('error', error);
    return NextResponse.redirect(url);
  }

  const config = getQuickBooksOAuthConfig();
  if (!config) return redirectHome('missing_intuit_credentials');
  if (!canPersistIntegrations()) return redirectHome(getIntegrationStorageErrorCode());

  const searchParams = request.nextUrl.searchParams;
  if (searchParams.get('error')) return redirectHome(searchParams.get('error') ?? 'access_denied');

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const realmId = searchParams.get('realmId');
  if (!code || !state || !realmId) return redirectHome('missing_oauth_params');

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);
  if (!expectedState || expectedState !== state) return redirectHome('invalid_oauth_state');

  try {
    const redirectUri = getQuickBooksSignupRedirectUri(config);
    const tokens = await exchangeQuickBooksAuthCode(config, code, redirectUri);
    if (!tokens.refresh_token) return redirectHome('missing_refresh_token');

    const email = emailFromIdToken(tokens.id_token);
    if (!email) return redirectHome('missing_intuit_email');

    const organisationName = await fetchQuickBooksCompanyNameWithToken(
      tokens.access_token,
      realmId,
      config.environment
    );

    const nextUrl = new URL('/onboarding/connect-gmail', APP_URL);
    nextUrl.searchParams.set('connected', '1');
    const { response, userId } = await ensureUserAndSessionCookies(
      email,
      { signup_provider: 'intuit' },
      nextUrl
    );

    await disconnectOtherBooks(userId, 'quickbooks');
    await saveQuickBooksConnection(userId, {
      realmId,
      organisationName,
      refreshToken: tokens.refresh_token
    });
    try {
      await ingestQuickBooksAr(userId);
    } catch (ingestError) {
      console.error('[auth/intuit] ingest failed:', ingestError);
    }

    return response;
  } catch (error) {
    console.error('[auth/intuit] signup failed:', error);
    return redirectHome(mapIntegrationSaveError(error));
  }
}
