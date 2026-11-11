'use client';

import { usePathname } from 'next/navigation';
import { RevCollectPageTransition } from '@/components/layout/revcollect-page-transition';
import { InboxOpenModeProvider } from '@/features/revcollect/inbox/components/inbox-open-mode-context';
import { BillingAccessBanner } from '@/features/revcollect/billing/billing-access-banner';

function isInboxPath(pathname: string) {
  return pathname === '/inbox' || pathname.startsWith('/inbox/');
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInbox = isInboxPath(pathname);

  const chrome = (
    <RevCollectPageTransition pathname={pathname} disabled>
      <div className='flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-hidden'>
        <BillingAccessBanner />
        {children}
      </div>
    </RevCollectPageTransition>
  );

  if (isInbox) {
    return <InboxOpenModeProvider>{chrome}</InboxOpenModeProvider>;
  }

  return chrome;
}
