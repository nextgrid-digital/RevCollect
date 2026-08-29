import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import {
  exchangeGoogleAuthCode,
  fetchGoogleAccountEmail,
  getGoogleOAuthConfig
} from '@/lib/integrations/google-oauth';
import { saveGmailConnection } from '@/lib/integrations/gmail-connection-store';
import {
  GMAIL_OAUTH_RETURN_COOKIE,
  sanitizeOAuthReturnPath
} from '@/lib/integrations/oauth-return';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';

const OAUTH_STATE_COOKIE = 'gmail_oauth_state';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const DEFAULT_RETURN = '/onboarding/connect-gmail';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const returnTo =
    sanitizeOAuthReturnPath(cookieStore.get(GMAIL_OAUTH_RETURN_COOKIE)?.value) ?? DEFAULT_RETURN;
  cookieStore.delete(GMAIL_OAUTH_RETURN_COOKIE);

  function redirectWithError(error: string) {
    const url = new URL(returnTo, APP_URL);
    url.searchParams.set('error', error);
    return NextResponse.redirect(url);
  }

  const config = getGoogleOAuthConfig();
  if (!config) {
    return redirectWithError('missing_google_credentials');
  }

  const searchParams = request.nextUrl.searchParams;
  const oauthError = searchParams.get('error');
  if (oauthError) {
    return redirectWithError(oauthError);
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) {
    return redirectWithError('missing_oauth_params');
  }

  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!expectedState || expectedState !== state) {
    return redirectWithError('invalid_oauth_state');
  }

  try {
    const tokens = await exchangeGoogleAuthCode(config, code);
    if (!tokens.refresh_token) {
      return redirectWithError('missing_refresh_token');
    }

    const email = await fetchGoogleAccountEmail(tokens.access_token);
    await saveGmailConnection(await getIntegrationTenantId(), {
      email,
      refreshToken: tokens.refresh_token
    });

    const successUrl = new URL(returnTo, APP_URL);
    successUrl.searchParams.set('connected', '1');
    return NextResponse.redirect(successUrl);
  } catch {
    return redirectWithError('gmail_connect_failed');
  }
}
