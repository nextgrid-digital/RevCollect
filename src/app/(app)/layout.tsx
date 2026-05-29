import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import { AppChrome } from '@/components/layout/app-chrome';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
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
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <KBar>
      <SidebarProvider
        defaultOpen={defaultOpen}
        className='h-svh max-h-svh min-h-0 overflow-hidden'
      >
        <AppSidebar />
        <SidebarInset className='flex min-h-0 flex-1 flex-col overflow-hidden'>
          <AppChrome>{children}</AppChrome>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
