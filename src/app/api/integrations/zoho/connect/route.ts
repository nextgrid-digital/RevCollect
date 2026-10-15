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
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import {
  assertCanStartBooksConnect,
  BOOKS_ALREADY_CONNECTED
} from '@/lib/integrations/books-exclusivity';
import { buildZohoAuthUrl, getZohoOAuthConfig } from '@/lib/integrations/zoho-oauth';
import {
  defaultZohoDataCenterIdFromEnv,
  getZohoDataCenter
} from '@/lib/integrations/zoho-regions';

const OAUTH_STATE_COOKIE = 'zoho_oauth_state';
const OAUTH_DC_COOKIE = 'zoho_oauth_dc';
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

  const tenantId = await getIntegrationTenantId();
  const allowed = await assertCanStartBooksConnect(tenantId, 'zoho');
  if (!allowed.ok) {
    return errorRedirect(BOOKS_ALREADY_CONNECTED, returnTo);
  }

  const requestedDc = request.nextUrl.searchParams.get('dc');
  const dataCenter =
    getZohoDataCenter(requestedDc) ?? getZohoDataCenter(defaultZohoDataCenterIdFromEnv());
  if (!dataCenter) {
    return errorRedirect('missing_zoho_credentials', returnTo);
  }

  const state = randomBytes(24).toString('hex');
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: OAUTH_STATE_MAX_AGE,
    path: '/'
  });
  cookieStore.set(OAUTH_DC_COOKIE, dataCenter.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: OAUTH_STATE_MAX_AGE,
    path: '/'
  });
  cookieStore.set(ZOHO_OAUTH_RETURN_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: OAUTH_RETURN_MAX_AGE,
    path: '/'
  });

  return NextResponse.redirect(
    buildZohoAuthUrl(config, state, config.redirectUri, dataCenter.accountsUrl)
  );
}
