import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { ensureUserAndSessionCookies } from '@/lib/auth/create-session-for-email';
import { ingestZohoAr } from '@/lib/canonical/ingest-zoho';
import { disconnectOtherBooks } from '@/lib/integrations/disconnect-integration';
import {
  canPersistIntegrations,
  getIntegrationStorageErrorCode,
  mapIntegrationSaveError
} from '@/lib/integrations/integration-storage';
import { saveZohoConnection } from '@/lib/integrations/zoho-connection-store';
import {
  exchangeZohoAuthCode,
  fetchZohoOrganizations,
  fetchZohoUserEmail,
  getZohoOAuthConfig,
  getZohoSignupRedirectUri
} from '@/lib/integrations/zoho-oauth';

const OAUTH_STATE_COOKIE = 'zoho_signup_oauth_state';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(request: NextRequest) {
  function redirectHome(error: string) {
    const url = new URL('/', APP_URL);
    url.searchParams.set('error', error);
    return NextResponse.redirect(url);
  }

  const config = getZohoOAuthConfig();
  if (!config) return redirectHome('missing_zoho_credentials');
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
    const redirectUri = getZohoSignupRedirectUri(config);
    const tokens = await exchangeZohoAuthCode(config, code, redirectUri);
    if (!tokens.refresh_token) return redirectHome('missing_refresh_token');

    const email = await fetchZohoUserEmail(tokens.access_token, config.accountsUrl);
    if (!email) return redirectHome('missing_zoho_email');

    const apiBase = tokens.api_domain
      ? `${tokens.api_domain.replace(/\/$/, '')}/books/v3`
      : config.apiBase;
    const organisations = await fetchZohoOrganizations(tokens.access_token, apiBase);
    const organisation = organisations[0];
    if (!organisation) return redirectHome('no_zoho_organisation');

    const nextUrl = new URL('/onboarding/connect-gmail', APP_URL);
    nextUrl.searchParams.set('connected', '1');
    const { response, userId } = await ensureUserAndSessionCookies(
      email,
      { signup_provider: 'zoho' },
      nextUrl
    );

    await disconnectOtherBooks(userId, 'zoho');
    await saveZohoConnection(userId, {
      organizationId: organisation.organization_id,
      organisationName: organisation.name,
      refreshToken: tokens.refresh_token,
      apiBase
    });
    try {
      await ingestZohoAr(userId);
    } catch (ingestError) {
      console.error('[auth/zoho] ingest failed:', ingestError);
    }

    return response;
  } catch (error) {
    console.error('[auth/zoho] signup failed:', error);
    return redirectHome(mapIntegrationSaveError(error));
  }
}
