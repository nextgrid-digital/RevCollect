import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import { probeQuickBooksClientCredentials } from '@/lib/integrations/quickbooks-oauth';

export const runtime = 'nodejs';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const probe = await probeQuickBooksClientCredentials();
  const keysAccepted = probe.probeError === 'invalid_grant';
  return NextResponse.json({
    ...probe,
    keysAccepted,
    hint: keysAccepted
      ? 'Client ID and Secret are valid. If Connect still fails, the redirect URI on the Intuit Production tab does not match.'
      : probe.probeError === 'invalid_client'
        ? 'Intuit rejected the Client ID/Secret pair running on this server. Recopy both from the Production keys tab.'
        : 'See probeError.'
  });
}
