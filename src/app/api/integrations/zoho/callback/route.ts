import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { ingestZohoAr } from '@/lib/canonical/ingest-zoho';
import { disconnectOtherBooks } from '@/lib/integrations/disconnect-integration';
import {
  canPersistIntegrations,
  getIntegrationStorageErrorCode,
  mapIntegrationSaveError
} from '@/lib/integrations/integration-storage';
import { sanitizeOAuthReturnPath, ZOHO_OAUTH_RETURN_COOKIE } from '@/lib/integrations/oauth-return';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import { saveZohoConnection } from '@/lib/integrations/zoho-connection-store';
import {
  exchangeZohoAuthCode,
  fetchZohoOrganizations,
  getZohoOAuthConfig
} from '@/lib/integrations/zoho-oauth';

const OAUTH_STATE_COOKIE = 'zoho_oauth_state';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const DEFAULT_RETURN = '/onboarding/connect-zoho';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const returnTo =
    sanitizeOAuthReturnPath(cookieStore.get(ZOHO_OAUTH_RETURN_COOKIE)?.value) ?? DEFAULT_RETURN;
  cookieStore.delete(ZOHO_OAUTH_RETURN_COOKIE);

  function redirectWithError(error: string) {
    const url = new URL(returnTo, APP_URL);
    url.searchParams.set('error', error);
    return NextResponse.redirect(url);
  }

  const config = getZohoOAuthConfig();
  if (!config) return redirectWithError('missing_zoho_credentials');
  if (!canPersistIntegrations()) return redirectWithError(getIntegrationStorageErrorCode());

  const searchParams = request.nextUrl.searchParams;
  if (searchParams.get('error'))
    return redirectWithError(searchParams.get('error') ?? 'access_denied');

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) return redirectWithError('missing_oauth_params');

  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);
  if (!expectedState || expectedState !== state) return redirectWithError('invalid_oauth_state');

  try {
    const tokens = await exchangeZohoAuthCode(config, code);
    if (!tokens.refresh_token) return redirectWithError('missing_refresh_token');

    const apiBase = tokens.api_domain
      ? `${tokens.api_domain.replace(/\/$/, '')}/books/v3`
      : config.apiBase;
    const organisations = await fetchZohoOrganizations(tokens.access_token, apiBase);
    const organisation = organisations[0];
    if (!organisation) return redirectWithError('no_zoho_organisation');

    const tenantId = await getIntegrationTenantId();
    await disconnectOtherBooks(tenantId, 'zoho');
    await saveZohoConnection(tenantId, {
      organizationId: organisation.organization_id,
      organisationName: organisation.name,
      refreshToken: tokens.refresh_token,
      apiBase
    });
    try {
      await ingestZohoAr(tenantId);
    } catch (ingestError) {
      console.error('[zoho/callback] ingest failed:', ingestError);
    }

    const successUrl = new URL(returnTo, APP_URL);
    successUrl.searchParams.set('connected', '1');
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('[zoho/callback] connect failed:', error);
    return redirectWithError(mapIntegrationSaveError(error));
  }
}
