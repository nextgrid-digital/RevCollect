const ALLOWED_RETURN_PATHS = new Set([
  '/settings/integrations',
  '/onboarding/connect-xero',
  '/onboarding/connect-gmail'
]);

export const XERO_OAUTH_RETURN_COOKIE = 'xero_oauth_return';
export const GMAIL_OAUTH_RETURN_COOKIE = 'gmail_oauth_return';
export const OAUTH_RETURN_MAX_AGE = 60 * 10;

export function sanitizeOAuthReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('://') || value.includes('\\')) return null;
  const path = value.split('?')[0];
  if (!ALLOWED_RETURN_PATHS.has(path)) return null;
  return path;
}
