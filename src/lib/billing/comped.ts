import { createAdminClient, hasSupabaseAdminEnv } from '@/lib/supabase/admin';

const BUILTIN_COMPED_EMAILS = ['admin@revcollect.ai'] as const;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getCompedEmails(): Set<string> {
  const fromEnv = (process.env.BILLING_COMPED_EMAILS ?? '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  return new Set([...BUILTIN_COMPED_EMAILS.map(normalizeEmail), ...fromEnv]);
}

export function isCompedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getCompedEmails().has(normalizeEmail(email));
}

export async function emailForUserId(userId: string): Promise<string | null> {
  if (!hasSupabaseAdminEnv()) return null;
  try {
    const { data, error } = await createAdminClient().auth.admin.getUserById(userId);
    if (error || !data.user?.email) return null;
    return data.user.email;
  } catch {
    return null;
  }
}
