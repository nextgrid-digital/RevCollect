import { hasSupabaseAdminEnv } from '@/lib/supabase/admin';

export function canPersistIntegrations(): boolean {
  if (hasSupabaseAdminEnv()) return true;
  // Vercel/serverless filesystem is read-only — tokens must live in Supabase.
  if (process.env.VERCEL === '1') return false;
  return true;
}

export function getIntegrationStorageErrorCode(): string {
  return 'missing_integration_storage';
}

export function getIntegrationStorageErrorMessage(): string {
  return 'Integration storage is not configured for production. Add SUPABASE_SECRET_KEY on Vercel and redeploy.';
}

export function isReadOnlyFilesystemError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return code === 'EROFS' || code === 'EPERM' || code === 'EACCES';
}

export function mapIntegrationSaveError(
  error: unknown,
  provider: 'xero' | 'quickbooks' | 'zoho' | 'gmail' = 'xero'
): string {
  if (!canPersistIntegrations() || isReadOnlyFilesystemError(error)) {
    return getIntegrationStorageErrorCode();
  }

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('EMAIL_ENCRYPTION_KEY')) {
    if (provider === 'quickbooks') return 'missing_intuit_credentials';
    if (provider === 'zoho') return 'missing_zoho_credentials';
    if (provider === 'gmail') return 'missing_google_credentials';
    return 'missing_xero_credentials';
  }

  if (provider === 'zoho' && message.includes('organizations failed')) {
    return 'zoho_organizations_failed';
  }

  if (message.includes('token exchange failed')) {
    if (provider === 'zoho') return 'zoho_connect_failed';
    if (provider === 'gmail') return 'gmail_connect_failed';
    if (provider === 'quickbooks') {
      if (message.includes('invalid_client')) return 'intuit_invalid_client';
      return 'intuit_connect_failed';
    }
    return 'xero_connect_failed';
  }

  if (message.includes('redirect_uri') || message.includes('invalid_grant')) {
    if (provider === 'xero') return 'xero_redirect_mismatch';
    if (provider === 'quickbooks') return 'intuit_redirect_mismatch';
    if (provider === 'zoho') return 'zoho_connect_failed';
    if (provider === 'gmail') return 'gmail_connect_failed';
    return 'xero_redirect_mismatch';
  }

  if (message.includes('integration')) {
    return 'integration_storage_failed';
  }

  if (provider === 'zoho') return 'zoho_connect_failed';
  if (provider === 'gmail') return 'gmail_connect_failed';
  if (provider === 'quickbooks') return 'intuit_connect_failed';
  return 'xero_connect_failed';
}
