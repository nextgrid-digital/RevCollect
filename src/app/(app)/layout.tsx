import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import { AppChrome } from '@/components/layout/app-chrome';
import { AppSettingsShell } from '@/components/layout/app-settings-shell';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'RevCollect',
  description: 'AI-powered accounts receivable and collections',
  robots: {
    index: false,
    follow: false
  }
};

async function getAuthUser(): Promise<{ name: string; email: string }> {
  if (!hasSupabaseEnv()) {
    return { name: 'User', email: '' };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const email = user?.email ?? '';
  const name =
    (typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user?.user_metadata?.name === 'string' && user.user_metadata.name) ||
    (email ? email.split('@')[0] : 'User');

  return { name, email };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  const user = await getAuthUser();

  return (
    <KBar>
      <AppSettingsShell>
        <SidebarProvider
          defaultOpen={defaultOpen}
          className='h-svh max-h-svh min-h-0 overflow-hidden'
        >
          <AppSidebar user={user} />
          <SidebarInset className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            <AppChrome>{children}</AppChrome>
          </SidebarInset>
        </SidebarProvider>
      </AppSettingsShell>
    </KBar>
  );
}
