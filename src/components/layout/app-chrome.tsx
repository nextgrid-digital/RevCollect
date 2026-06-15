'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/header';
import { InfobarProvider } from '@/components/ui/infobar';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InboxOpenModeProvider } from '@/features/revcollect/inbox/components/inbox-open-mode-context';

function isInboxPath(pathname: string) {
  return pathname === '/inbox' || pathname.startsWith('/inbox/');
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInbox = isInboxPath(pathname);

  const chrome = (
    <>
      <Header />
      <InfobarProvider defaultOpen={false}>
        <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>{children}</div>
        <InfoSidebar side='right' />
      </InfobarProvider>
    </>
  );

  if (isInbox) {
    return <InboxOpenModeProvider>{chrome}</InboxOpenModeProvider>;
  }

  return chrome;
}
