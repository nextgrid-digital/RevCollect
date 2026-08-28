import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthPage } from '@/components/auth-page';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';

export const metadata: Metadata = {
  title: 'RevCollect',
  description: 'Accounts receivable collections inbox for finance teams'
};

export default async function HomePage() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) {
      redirect(POST_LOGIN_PATH);
    }
  }

  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  );
}
