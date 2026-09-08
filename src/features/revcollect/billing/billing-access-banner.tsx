'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAgentAddonStatus } from '@/features/revcollect/api/queries';
import { Button } from '@/components/ui/button';

export function BillingAccessBanner() {
  const pathname = usePathname();
  const { data } = useAgentAddonStatus();

  if (!data || pathname.startsWith('/settings')) {
    return null;
  }

  if (data.canWrite === false) {
    return (
      <div className='bg-muted text-foreground flex items-center justify-between gap-3 border-b px-4 py-2 text-sm'>
        <p>Trial ended. The workspace is read-only until you subscribe at $49/month.</p>
        <Button asChild size='sm'>
          <Link href='/settings/billing'>Subscribe</Link>
        </Button>
      </div>
    );
  }

  if (data.inTrial && (data.daysLeft ?? 0) <= 7) {
    return (
      <div className='bg-muted text-foreground flex items-center justify-between gap-3 border-b px-4 py-2 text-sm'>
        <p>
          {data.daysLeft === 1
            ? 'Your free month ends tomorrow.'
            : `${data.daysLeft} days left in your free month.`}{' '}
          Then $49/month. Agent is $39 extra after trial.
        </p>
        <Button asChild size='sm' variant='outline'>
          <Link href='/settings/billing'>See billing</Link>
        </Button>
      </div>
    );
  }

  return null;
}
