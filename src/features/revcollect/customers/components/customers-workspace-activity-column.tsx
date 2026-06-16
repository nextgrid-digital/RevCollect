'use client';

import { useRouter } from 'next/navigation';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { cn } from '@/lib/utils';
import { workspaceContextWidth } from '@/features/revcollect/lib/workspace-layout';
import {
  useCustomer,
  useInboxThreadForCustomer,
  useThreadEmails,
  useTimelineForCustomer
} from '../../api/queries';
import { CustomerActivityAside } from './customers-detail-panel';

interface CustomersWorkspaceActivityColumnProps {
  customerId: string;
}

export function CustomersWorkspaceActivityColumn({
  customerId
}: CustomersWorkspaceActivityColumnProps) {
  const router = useRouter();
  const { data: customer, isPending } = useCustomer(customerId);
  const { data: timeline = [] } = useTimelineForCustomer(customerId);
  const { data: inboxThread } = useInboxThreadForCustomer(customerId);
  const { data: threadEmails = [] } = useThreadEmails(inboxThread?.id);

  if (isPending || !customer) {
    return (
      <div
        className={cn(
          'hidden min-h-0 min-w-0 shrink-0 flex-col gap-2 self-stretch md:flex',
          workspaceContextWidth
        )}
        aria-hidden
      />
    );
  }

  const handleActivityEmailClick = (emailId: string) => {
    if (!inboxThread) return;
    router.push(`/inbox/${inboxThread.id}#${emailId}`);
  };

  return (
    <div
      className={cn(
        'hidden min-h-0 min-w-0 shrink-0 flex-col gap-2 self-stretch md:flex',
        workspaceContextWidth
      )}
    >
      <div className='h-8 shrink-0' aria-hidden />
      <WorkspaceCard variant='context' className='min-h-0 w-full min-w-0 flex-1'>
        <CustomerActivityAside
          timeline={timeline}
          threadEmails={threadEmails}
          onEventClick={inboxThread ? handleActivityEmailClick : undefined}
        />
      </WorkspaceCard>
    </div>
  );
}
