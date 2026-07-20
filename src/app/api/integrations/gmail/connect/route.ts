import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildGoogleAuthUrl, getGoogleOAuthConfig } from '@/lib/integrations/google-oauth';

const OAUTH_STATE_COOKIE = 'gmail_oauth_state';
const OAUTH_STATE_MAX_AGE = 60 * 10;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET() {
  const config = getGoogleOAuthConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL('/onboarding/connect-gmail?error=missing_google_credentials', APP_URL)
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

  const authUrl = buildGoogleAuthUrl(config, state);
  return NextResponse.redirect(authUrl);
}
