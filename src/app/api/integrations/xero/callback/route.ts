import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import {
  canPersistIntegrations,
  getIntegrationStorageErrorCode,
  mapIntegrationSaveError
} from '@/lib/integrations/integration-storage';
import { saveXeroConnection } from '@/lib/integrations/xero-connection-store';
import {
  exchangeXeroAuthCode,
  fetchXeroConnections,
  getXeroOAuthConfig
} from '@/lib/integrations/xero-oauth';
import { ingestXeroAr } from '@/lib/canonical/ingest-xero';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';

const OAUTH_STATE_COOKIE = 'xero_oauth_state';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function redirectWithError(error: string) {
  const url = new URL('/onboarding/connect-xero', APP_URL);
  url.searchParams.set('error', error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const config = getXeroOAuthConfig();
  if (!config) {
    return redirectWithError('missing_xero_credentials');
  }

  if (!canPersistIntegrations()) {
    return redirectWithError(getIntegrationStorageErrorCode());
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

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!expectedState || expectedState !== state) {
    return redirectWithError('invalid_oauth_state');
  }

  try {
    const tokens = await exchangeXeroAuthCode(config, code);
    if (!tokens.refresh_token) {
      return redirectWithError('missing_refresh_token');
    }

    const connections = await fetchXeroConnections(tokens.access_token);
    const organisation = connections[0];
    if (!organisation) {
      return redirectWithError('no_xero_organisation');
    }

    const tenantId = await getIntegrationTenantId();
    await saveXeroConnection(tenantId, {
      xeroTenantId: organisation.tenantId,
      organisationName: organisation.tenantName,
      refreshToken: tokens.refresh_token
    });
    try {
      await ingestXeroAr(tenantId);
    } catch (ingestError) {
      console.error('[xero/callback] ingest failed:', ingestError);
    }

    const successUrl = new URL('/onboarding/connect-xero', APP_URL);
    successUrl.searchParams.set('connected', '1');
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('[xero/callback] connect failed:', error);
    return redirectWithError(mapIntegrationSaveError(error));
  }
}
