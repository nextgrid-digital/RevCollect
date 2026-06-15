'use client';

import { usePathname } from 'next/navigation';
import { InboxOpenModeSwitcher } from './inbox-open-mode-switcher';

function isInboxPath(pathname: string) {
  return pathname === '/inbox' || pathname.startsWith('/inbox/');
}

export function InboxHeaderActions() {
  const pathname = usePathname();

  if (!isInboxPath(pathname)) {
    return null;
  }

  return <InboxOpenModeSwitcher />;
}
