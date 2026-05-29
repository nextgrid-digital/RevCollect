import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { CustomerAvatar } from './customer-avatar';
import { StatusPill } from './status-pill';
import { InboxActivityCard } from '../inbox/components/inbox-activity-card';
import { InboxAiInsightCard } from '../inbox/components/inbox-ai-insight-card';
import { InboxContextRailBody } from '../inbox/components/inbox-context-rail-body';
import { InboxEscalationCard } from '../inbox/components/inbox-escalation-card';
import type { Customer, CustomerInboxContext, ThreadEmail, TimelineEvent } from '../types';

interface CustomerContextPanelProps {
  customer: Customer;
  threadSubject?: string;
  threadSummary?: string;
  inboxContext: CustomerInboxContext;
  escalationInsight?: string;
  timelineEvents?: TimelineEvent[];
  threadEmails?: ThreadEmail[];
  onActivityEmailClick?: (emailId: string) => void;
}

export function CustomerContextPanelFloatingHeader({ customer }: { customer: Customer }) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-3'>
        <CustomerAvatar
          name={customer.name}
          avatarUrl={customer.avatarUrl}
          className='size-10 shrink-0'
        />
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-semibold'>{customer.company}</p>
          <p className='text-muted-foreground truncate text-sm'>{customer.name}</p>
        </div>
      </div>
      <Button asChild className='w-full rounded-full' variant='outline' size='sm'>
        <Link href={`/customers/${customer.id}`} className='gap-1.5'>
          View customer
          <Icons.externalLink className='size-3.5' />
        </Link>
      </Button>
    </div>
  );
}

export function CustomerContextPanelFloatingBody({
  customer,
  inboxContext
}: {
  customer: Customer;
  inboxContext: CustomerInboxContext;
}) {
  return <InboxContextRailBody customer={customer} context={inboxContext} />;
}

export function CustomerContextPanel({
  customer,
  threadSubject,
  threadSummary,
  inboxContext,
  escalationInsight,
  timelineEvents = [],
  threadEmails = [],
  onActivityEmailClick
}: CustomerContextPanelProps) {
  const aiInsightText =
    inboxContext.aiInsight || (threadSummary && threadSubject ? threadSummary : '');

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='flex items-start gap-3 p-4'>
        <CustomerAvatar name={customer.name} avatarUrl={customer.avatarUrl} className='size-10' />
        <div className='min-w-0 flex-1'>
          <p className='truncate font-semibold'>{customer.company}</p>
          <p className='text-muted-foreground truncate text-sm'>{customer.name}</p>
          <div className='mt-2'>
            <StatusPill status={customer.status} />
          </div>
        </div>
      </div>

      <div className='flex-1 space-y-4 overflow-auto px-3 pb-4'>
        <InboxContextRailBody customer={customer} context={inboxContext} />
        {aiInsightText ? <InboxAiInsightCard text={aiInsightText} /> : null}
        {escalationInsight ? <InboxEscalationCard text={escalationInsight} /> : null}
        <InboxActivityCard
          events={timelineEvents}
          threadEmails={threadEmails}
          onEventClick={onActivityEmailClick}
        />
      </div>

      <div className='bg-background sticky bottom-0 border-t p-4'>
        <Button asChild className='w-full' variant='outline' size='sm'>
          <Link href={`/customers/${customer.id}`}>View customer</Link>
        </Button>
      </div>
    </div>
  );
}
