'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useCustomer } from '@/features/revcollect/api/queries';

type BreadcrumbItem = {
  title: string;
  link: string;
};

const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/inbox': [{ title: 'Inbox', link: '/inbox' }],
  '/customers': [{ title: 'Customers', link: '/customers' }],
  '/aging': [{ title: 'Aging', link: '/aging' }],
  '/agent': [{ title: 'Agent', link: '/agent' }],
  '/onboarding': [{ title: 'Onboarding', link: '/onboarding' }]
};

export function useBreadcrumbs() {
  const pathname = usePathname();
  const customerMatch = pathname.match(/^\/customers\/([^/]+)$/);
  const customerId = customerMatch?.[1];
  const { data: customer } = useCustomer(customerId);

  const breadcrumbs = useMemo(() => {
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    if (customerMatch) {
      return [
        { title: 'Customers', link: '/customers' },
        { title: customer?.company ?? 'Detail', link: pathname }
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
  }, [pathname, customerMatch, customer?.company]);

  return breadcrumbs;
}
