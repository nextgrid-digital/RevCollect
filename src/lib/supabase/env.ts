const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

export function getSupabaseEnv(): { url: string; key: string } {
  const url = supabaseUrl;
  // Prefer classic anon JWT — most reliable with @supabase/ssr
  const key = supabaseAnonKey || supabasePublishableKey;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  return { url, key };
}

export function hasSupabaseEnv(): boolean {
  return Boolean(supabaseUrl && (supabaseAnonKey || supabasePublishableKey));
}
