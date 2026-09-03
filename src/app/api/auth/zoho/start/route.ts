import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  canPersistIntegrations,
  getIntegrationStorageErrorCode
} from '@/lib/integrations/integration-storage';
import {
  buildZohoAuthUrl,
  getZohoOAuthConfig,
  getZohoSignupRedirectUri
} from '@/lib/integrations/zoho-oauth';

const OAUTH_STATE_COOKIE = 'zoho_signup_oauth_state';
const OAUTH_STATE_MAX_AGE = 60 * 10;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET() {
  const config = getZohoOAuthConfig();
  if (!config) {
    const url = new URL('/', APP_URL);
    url.searchParams.set('error', 'missing_zoho_credentials');
    return NextResponse.redirect(url);
  }

  if (!canPersistIntegrations()) {
    const url = new URL('/', APP_URL);
    url.searchParams.set('error', getIntegrationStorageErrorCode());
    return NextResponse.redirect(url);
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

  return NextResponse.redirect(buildZohoAuthUrl(config, state, getZohoSignupRedirectUri(config)));
}
