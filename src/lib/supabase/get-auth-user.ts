import { cache } from 'react';
import { AUTH_CLAIMS_TIMEOUT_MS, withTimeout } from '@/lib/auth-timeout';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';

interface AuthClaims {
  sub?: string;
  email?: string;
  name?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

const getAuthClaims = cache(async (): Promise<AuthClaims | null> => {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data } = await withTimeout(supabase.auth.getClaims(), AUTH_CLAIMS_TIMEOUT_MS);
    return (data?.claims as AuthClaims | undefined) ?? null;
  } catch {
    return null;
  }
});

export const getAuthUserId = cache(async (): Promise<string | null> => {
  const claims = await getAuthClaims();
  return claims?.sub ?? null;
});

export const getAuthUser = cache(
  async (): Promise<{ name: string; email: string; avatar?: string }> => {
    const claims = await getAuthClaims();
    const email = claims?.email ?? '';
    const name =
      claims?.user_metadata?.full_name ||
      claims?.user_metadata?.name ||
      claims?.name ||
      (email ? email.split('@')[0] : 'User');
    const avatar = claims?.user_metadata?.avatar_url || claims?.user_metadata?.picture;
    return { name, email, avatar };
  }
);
