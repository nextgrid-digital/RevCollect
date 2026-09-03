const ALLOWED_RETURN_PATHS = new Set([
  '/settings/integrations',
  '/onboarding',
  '/onboarding/connect-xero',
  '/onboarding/connect-gmail',
  '/onboarding/connect-quickbooks',
  '/onboarding/connect-zoho',
  '/connect/quickbooks'
]);

export const XERO_OAUTH_RETURN_COOKIE = 'xero_oauth_return';
export const GMAIL_OAUTH_RETURN_COOKIE = 'gmail_oauth_return';
export const QUICKBOOKS_OAUTH_RETURN_COOKIE = 'quickbooks_oauth_return';
export const ZOHO_OAUTH_RETURN_COOKIE = 'zoho_oauth_return';
export const OAUTH_RETURN_MAX_AGE = 60 * 10;

export function sanitizeOAuthReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('://') || value.includes('\\')) return null;
  const path = value.split('?')[0];
  if (!ALLOWED_RETURN_PATHS.has(path)) return null;
  return path;
}
