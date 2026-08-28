import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_REQUEST_TIMEOUT_MS, withTimeout } from '@/lib/auth-timeout';
import { POST_LOGIN_PATH, safeNextPath } from '@/lib/auth-paths';
import { getSupabaseEnv } from '@/lib/supabase/env';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next') ?? POST_LOGIN_PATH);

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
  }

  const cookieStore = await cookies();
  const env = getSupabaseEnv();
  const redirectResponse = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          redirectResponse.cookies.set(name, value, options);
        });
      }
    }
  });

  try {
    const { error } = await withTimeout(
      supabase.auth.exchangeCodeForSession(code),
      AUTH_REQUEST_TIMEOUT_MS
    );
    if (error) {
      return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
    }
  } catch {
    return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
  }

  return redirectResponse;
}
