import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import {
  canPersistIntegrations,
  getIntegrationStorageErrorCode
} from '@/lib/integrations/integration-storage';
import {
  OAUTH_RETURN_MAX_AGE,
  sanitizeOAuthReturnPath,
  XERO_OAUTH_RETURN_COOKIE
} from '@/lib/integrations/oauth-return';
import { buildXeroAuthUrl, getXeroOAuthConfig } from '@/lib/integrations/xero-oauth';

const OAUTH_STATE_COOKIE = 'xero_oauth_state';
const OAUTH_STATE_MAX_AGE = 60 * 10;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const DEFAULT_RETURN = '/onboarding/connect-xero';

function errorRedirect(error: string, returnTo: string) {
  const url = new URL(returnTo, APP_URL);
  url.searchParams.set('error', error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const returnTo =
    sanitizeOAuthReturnPath(request.nextUrl.searchParams.get('returnTo')) ?? DEFAULT_RETURN;
  const config = getXeroOAuthConfig();
  if (!config) {
    return errorRedirect('missing_xero_credentials', returnTo);
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
  cookieStore.set(XERO_OAUTH_RETURN_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: OAUTH_RETURN_MAX_AGE,
    path: '/'
  });

  return NextResponse.redirect(buildXeroAuthUrl(config, state));
}
