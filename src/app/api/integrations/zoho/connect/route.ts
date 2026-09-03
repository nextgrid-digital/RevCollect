import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import {
  canPersistIntegrations,
  getIntegrationStorageErrorCode
} from '@/lib/integrations/integration-storage';
import {
  OAUTH_RETURN_MAX_AGE,
  ZOHO_OAUTH_RETURN_COOKIE,
  sanitizeOAuthReturnPath
} from '@/lib/integrations/oauth-return';
import { buildZohoAuthUrl, getZohoOAuthConfig } from '@/lib/integrations/zoho-oauth';

const OAUTH_STATE_COOKIE = 'zoho_oauth_state';
const OAUTH_STATE_MAX_AGE = 60 * 10;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const DEFAULT_RETURN = '/onboarding/connect-zoho';

function errorRedirect(error: string, returnTo: string) {
  const url = new URL(returnTo, APP_URL);
  url.searchParams.set('error', error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const returnTo =
    sanitizeOAuthReturnPath(request.nextUrl.searchParams.get('returnTo')) ?? DEFAULT_RETURN;
  const config = getZohoOAuthConfig();
  if (!config) {
    return errorRedirect('missing_zoho_credentials', returnTo);
  }

  if (!canPersistIntegrations()) {
    return errorRedirect(getIntegrationStorageErrorCode(), returnTo);
  }

  const state = randomBytes(24).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: OAUTH_STATE_MAX_AGE,
    path: '/'
  });
  cookieStore.set(ZOHO_OAUTH_RETURN_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: OAUTH_RETURN_MAX_AGE,
    path: '/'
  });

  return NextResponse.redirect(buildZohoAuthUrl(config, state));
}
