import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import { AppChrome } from '@/components/layout/app-chrome';
import { AppSettingsShell } from '@/components/layout/app-settings-shell';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppUserProvider } from '@/lib/supabase/app-user-context';
import { getAuthUser } from '@/lib/supabase/get-auth-user';
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

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';
  const user = await getAuthUser();

  return (
    <KBar>
      <AppSettingsShell>
        <AppUserProvider user={user}>
          <SidebarProvider
            defaultOpen={defaultOpen}
            className='h-svh max-h-svh min-h-0 overflow-hidden'
          >
            <AppSidebar user={user} />
            <SidebarInset className='flex min-h-0 flex-1 flex-col overflow-hidden'>
              <AppChrome>{children}</AppChrome>
            </SidebarInset>
          </SidebarProvider>
        </AppUserProvider>
      </AppSettingsShell>
    </KBar>
  );
}
