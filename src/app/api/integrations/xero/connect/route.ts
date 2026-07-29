import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  canPersistIntegrations,
  getIntegrationStorageErrorCode
} from '@/lib/integrations/integration-storage';
import { buildXeroAuthUrl, getXeroOAuthConfig } from '@/lib/integrations/xero-oauth';

const OAUTH_STATE_COOKIE = 'xero_oauth_state';
const OAUTH_STATE_MAX_AGE = 60 * 10;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET() {
  const config = getXeroOAuthConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL('/onboarding/connect-xero?error=missing_xero_credentials', APP_URL)
    );
  }

  if (!canPersistIntegrations()) {
    return NextResponse.redirect(
      new URL(`/onboarding/connect-xero?error=${getIntegrationStorageErrorCode()}`, APP_URL)
    );
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

  return NextResponse.redirect(buildXeroAuthUrl(config, state));
}
