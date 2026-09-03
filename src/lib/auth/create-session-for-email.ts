import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabaseEnv } from '@/lib/supabase/env';

async function sessionFromEmail(
  email: string,
  metadata: Record<string, string>,
  redirectUrl: URL
): Promise<{ response: NextResponse; userId: string }> {
  const admin = createAdminClient();
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email
  });
  if (linkError || !link.properties?.hashed_token) {
    throw linkError ?? new Error('Could not create a sign-in session');
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(redirectUrl);
  const env = getSupabaseEnv();
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: link.properties.hashed_token
  });
  if (verifyError) {
    throw verifyError;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (userError || !userId) {
    throw userError ?? new Error('Could not resolve user after signup');
  }

  if (Object.keys(metadata).length > 0) {
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...userData.user.user_metadata, ...metadata }
    });
  }

  return { response, userId };
}

export async function ensureSessionForUserId(
  userId: string,
  metadata: Record<string, string>,
  redirectUrl: URL
): Promise<{ response: NextResponse; userId: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  const email = data.user?.email?.trim();
  if (error || !email) {
    throw error ?? new Error('Existing workspace has no email');
  }
  return sessionFromEmail(email, metadata, redirectUrl);
}

export async function ensureUserAndSessionCookies(
  email: string,
  metadata: Record<string, string>,
  redirectUrl: URL
): Promise<{ response: NextResponse; userId: string }> {
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: metadata
  });
  if (createError && !createError.message.toLowerCase().includes('already')) {
    throw createError;
  }

  return sessionFromEmail(email, metadata, redirectUrl);
}
