'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/inbox': [{ title: 'Inbox', link: '/inbox' }],
  '/customers': [{ title: 'Customers', link: '/customers' }],
  '/aging': [{ title: 'Aging', link: '/aging' }],
  '/agent': [{ title: 'Agent', link: '/agent' }],
  '/onboarding': [{ title: 'Onboarding', link: '/onboarding' }]
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    const customerMatch = pathname.match(/^\/customers\/([^/]+)$/);
    if (customerMatch) {
      return [
        { title: 'Customers', link: '/customers' },
        { title: 'Detail', link: pathname }
      ];
    }

    const inboxMessageMatch = pathname.match(/^\/inbox\/([^/]+)$/);
    if (inboxMessageMatch) {
      return [
        { title: 'Inbox', link: '/inbox' },
        { title: 'Message', link: pathname }
      ];
    }

    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
