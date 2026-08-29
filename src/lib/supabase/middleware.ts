import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_CLAIMS_TIMEOUT_MS, withTimeout } from '@/lib/auth-timeout';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';

// Read env with static property access so Next can inline them into the proxy bundle
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/auth/') ||
    pathname === '/audit' ||
    pathname.startsWith('/audit/') ||
    pathname.startsWith('/api/audit/') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.svg' ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png' ||
    pathname === '/apple-icon' ||
    pathname.startsWith('/eve/')
  );
}

function getEnv(): { url: string; key: string } | null {
  const url = supabaseUrl?.trim();
  const key = (supabaseAnonKey || supabasePublishableKey)?.trim();
  if (!url || !key) return null;
  return { url, key };
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const env = getEnv();

  if (!env) {
    const { pathname } = request.nextUrl;
    if (isPublicPath(pathname)) {
      return NextResponse.next({ request });
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and key.' },
        { status: 503 }
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/';
    loginUrl.searchParams.set('error', 'missing_supabase_env');
    return NextResponse.redirect(loginUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      }
    }
  });

  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes('-auth-token'));

  let hasClaims = false;
  try {
    const { data, error } = await withTimeout(supabase.auth.getClaims(), AUTH_CLAIMS_TIMEOUT_MS);
    hasClaims = Boolean(data?.claims);
    if (!hasClaims && error && hasAuthCookie) {
      hasClaims = true;
    }
  } catch {
    hasClaims = false;
  }

  const isLoggedIn = hasClaims || hasAuthCookie;
  const { pathname } = request.nextUrl;

  if (!isLoggedIn && !isPublicPath(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/';
    loginUrl.search = '';
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    const redirectResponse = NextResponse.redirect(new URL(POST_LOGIN_PATH, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
