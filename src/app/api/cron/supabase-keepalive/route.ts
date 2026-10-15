import { NextResponse } from 'next/server';
import { isCronRequest } from '@/lib/ari/cron-auth';
import { createAdminClient, hasSupabaseAdminEnv } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * Free-plan Supabase pauses projects with insufficient DB activity over ~7 days.
 * Docs: https://supabase.com/docs/guides/platform/free-project-pausing
 * Scheduled every ~6 days via vercel.json (Hobby allows at most once per day).
 */
export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      { ok: false, error: 'supabase_not_configured' },
      { status: 503 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('tenants').select('id').limit(1);

  if (error) {
    console.error('[cron/supabase-keepalive]', error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
}
