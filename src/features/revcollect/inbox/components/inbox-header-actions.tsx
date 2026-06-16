'use client';

import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { InboxOpenModeMenu } from './inbox-open-mode-menu';

function isInboxPath(pathname: string) {
  return pathname === '/inbox' || pathname.startsWith('/inbox/');
}

export function InboxHeaderActions() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isInboxPath(pathname) || !isMobile) {
    return null;
  }

  return <InboxOpenModeMenu />;
}
