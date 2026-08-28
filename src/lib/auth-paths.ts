export const POST_LOGIN_PATH = '/dashboard';

export function safeNextPath(next: string | null | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : POST_LOGIN_PATH;
}
