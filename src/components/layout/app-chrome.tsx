'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/header';
import { InfobarProvider } from '@/components/ui/infobar';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InboxOpenModeProvider } from '@/features/revcollect/inbox/components/inbox-open-mode-context';

function isInboxPath(pathname: string) {
  return pathname === '/inbox' || pathname.startsWith('/inbox/');
}

function isCustomersWorkspacePath(pathname: string) {
  return pathname === '/customers' || pathname.startsWith('/customers/');
}

function isFullWidthHeaderPath(pathname: string) {
  return !isInboxPath(pathname) && !isCustomersWorkspacePath(pathname);
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInbox = isInboxPath(pathname);

  const chrome = (
    <>
      {isFullWidthHeaderPath(pathname) ? <Header /> : null}
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
