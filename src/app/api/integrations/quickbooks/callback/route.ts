import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { ingestQuickBooksAr } from '@/lib/canonical/ingest-quickbooks';
import { disconnectOtherBooks } from '@/lib/integrations/disconnect-integration';
import {
  canPersistIntegrations,
  getIntegrationStorageErrorCode,
  mapIntegrationSaveError
} from '@/lib/integrations/integration-storage';
import {
  sanitizeOAuthReturnPath,
  QUICKBOOKS_OAUTH_RETURN_COOKIE
} from '@/lib/integrations/oauth-return';
import { saveQuickBooksConnection } from '@/lib/integrations/quickbooks-connection-store';
import {
  exchangeQuickBooksAuthCode,
  fetchQuickBooksCompanyNameWithToken,
  getQuickBooksOAuthConfig
} from '@/lib/integrations/quickbooks-oauth';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';

const OAUTH_STATE_COOKIE = 'quickbooks_oauth_state';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const DEFAULT_RETURN = '/onboarding/connect-quickbooks';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const returnTo =
    sanitizeOAuthReturnPath(cookieStore.get(QUICKBOOKS_OAUTH_RETURN_COOKIE)?.value) ??
    DEFAULT_RETURN;
  cookieStore.delete(QUICKBOOKS_OAUTH_RETURN_COOKIE);

  function redirectWithError(error: string) {
    const url = new URL(returnTo, APP_URL);
    url.searchParams.set('error', error);
    return NextResponse.redirect(url);
  }

  const config = getQuickBooksOAuthConfig();
  if (!config) return redirectWithError('missing_intuit_credentials');
  if (!canPersistIntegrations()) return redirectWithError(getIntegrationStorageErrorCode());

  const searchParams = request.nextUrl.searchParams;
  if (searchParams.get('error'))
    return redirectWithError(searchParams.get('error') ?? 'access_denied');

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const realmId = searchParams.get('realmId');
  if (!code || !state || !realmId) return redirectWithError('missing_oauth_params');

  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);
  if (!expectedState || expectedState !== state) return redirectWithError('invalid_oauth_state');

  try {
    const tokens = await exchangeQuickBooksAuthCode(config, code);
    if (!tokens.refresh_token) return redirectWithError('missing_refresh_token');

    const organisationName = await fetchQuickBooksCompanyNameWithToken(
      tokens.access_token,
      realmId,
      config.environment
    );
    const tenantId = await getIntegrationTenantId();
    await disconnectOtherBooks(tenantId, 'quickbooks');
    await saveQuickBooksConnection(tenantId, {
      realmId,
      organisationName,
      refreshToken: tokens.refresh_token
    });
    try {
      await ingestQuickBooksAr(tenantId);
    } catch (ingestError) {
      console.error('[quickbooks/callback] ingest failed:', ingestError);
    }

    const successUrl = new URL(returnTo, APP_URL);
    successUrl.searchParams.set('connected', '1');
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('[quickbooks/callback] connect failed:', error);
    return redirectWithError(mapIntegrationSaveError(error));
  }
}
