'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { revcollectKeys } from '../../api/queries';

const CONNECT_ERROR_MESSAGES: Record<string, string> = {
  missing_xero_credentials:
    'Xero OAuth is not configured. Add XERO_CLIENT_ID, XERO_CLIENT_SECRET, and EMAIL_ENCRYPTION_KEY to your environment.',
  missing_google_credentials:
    'Google OAuth is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and EMAIL_ENCRYPTION_KEY to your environment.',
  missing_integration_storage:
    'Production storage is not configured. Add SUPABASE_SECRET_KEY on Vercel, redeploy, then reconnect Xero.',
  integration_storage_failed:
    'Connected but could not save the token. Check SUPABASE_SECRET_KEY and the integration_secrets table.',
  xero_redirect_mismatch:
    'Xero redirect URI mismatch. Set XERO_OAUTH_REDIRECT_URI to https://app.revcollect.ai/api/integrations/xero/callback on Vercel and in the Xero developer app.',
  missing_refresh_token:
    'OAuth did not return a refresh token. For Zoho: revoke the app under Accounts → Security → Connected Apps, then connect again.',
  invalid_oauth_state: 'OAuth session expired. Please try connecting again.',
  no_xero_organisation: 'No Xero organisation was returned. Check your Xero account and try again.',
  xero_connect_failed: 'Could not connect Xero. Check your Xero credentials and try again.',
  gmail_connect_failed: 'Could not connect Gmail. Check your Google credentials and try again.',
  missing_intuit_credentials:
    'QuickBooks OAuth is not configured. Add INTUIT_CLIENT_ID and INTUIT_CLIENT_SECRET.',
  intuit_connect_failed:
    'Could not connect QuickBooks. Check INTUIT_CLIENT_ID / SECRET, INTUIT_ENVIRONMENT, and redirect URIs on Vercel and the Intuit app.',
  intuit_redirect_mismatch:
    'QuickBooks redirect URI mismatch. Set INTUIT_OAUTH_REDIRECT_URI to https://app.revcollect.ai/api/integrations/quickbooks/callback on Vercel and on the Intuit Production keys tab.',
  missing_zoho_credentials:
    'Zoho OAuth is not configured. Add ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET.',
  no_zoho_organisation:
    'No Zoho Books organisation on this account. Create or join one at books.zoho.in (India) or books.zoho.com, then connect again with the same login.',
  zoho_organizations_failed:
    'Zoho authorized but could not list Books organisations. Reconnect and approve all scopes (including settings). Confirm you have a Zoho Books org on this account.',
  zoho_connect_failed: 'Could not connect Zoho Books. Check your Zoho credentials and try again.',
  books_already_connected:
    'This workspace already has a ledger connected. Disconnect it first to switch.',
  access_denied: 'Connection was cancelled.'
};

export function IntegrationConnectToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const error = searchParams.get('error');
  const detail = searchParams.get('detail');
  const connected = searchParams.get('connected');

  useEffect(() => {
    if (!error && connected !== '1') return;

    if (error) {
      const base = CONNECT_ERROR_MESSAGES[error] ?? 'Could not connect.';
      toast.error(detail ? `${base} (${detail})` : base);
    }

    if (connected === '1') {
      // Drop cached inbox threads so a QBO↔Zoho switch cannot show the previous ledger's mail.
      void queryClient.removeQueries({ queryKey: revcollectKeys.inbox() });
      void queryClient.invalidateQueries({
        queryKey: revcollectKeys.integrationStatus()
      });
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.all });
      toast.success('Connected');
    }

    router.replace(pathname, { scroll: false });
  }, [connected, detail, error, pathname, queryClient, router]);

  useEffect(() => {
    function refetchStatus() {
      if (document.visibilityState === 'hidden') return;
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.integrationStatus() });
    }

    window.addEventListener('focus', refetchStatus);
    document.addEventListener('visibilitychange', refetchStatus);
    return () => {
      window.removeEventListener('focus', refetchStatus);
      document.removeEventListener('visibilitychange', refetchStatus);
    };
  }, [queryClient]);

  return null;
}
