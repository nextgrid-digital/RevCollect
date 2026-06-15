import Link from 'next/link';
import { CustomerAvatar } from './customer-avatar';
import { InboxActivityCard } from '../inbox/components/inbox-activity-card';
import { InboxAiInsightCard } from '../inbox/components/inbox-ai-insight-card';
import { InboxContextRailBody } from '../inbox/components/inbox-context-rail-body';
import { InboxDeepAnalysisCard } from '../inbox/components/inbox-deep-analysis-card';
import type { Customer, CustomerInboxContext, ThreadEmail, TimelineEvent } from '../types';

interface CustomerContextPanelProps {
  customer: Customer;
  threadSubject?: string;
  threadSummary?: string;
  inboxContext: CustomerInboxContext;
  deepAnalysisText?: string;
  timelineEvents?: TimelineEvent[];
  threadEmails?: ThreadEmail[];
  onActivityEmailClick?: (emailId: string) => void;
}

export function CustomerContextPanelFloatingHeader({ customer }: { customer: Customer }) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-3'>
        <CustomerAvatar
          name={customer.company}
          avatarUrl={customer.avatarUrl}
          className='size-10 shrink-0'
        />
        <div className='min-w-0 flex-1'>
          <Link
            href={`/customers/${customer.id}`}
            className='hover:text-foreground/80 truncate text-sm font-semibold underline-offset-2 hover:underline'
          >
            {customer.company}
          </Link>
          <p className='text-muted-foreground truncate text-sm'>{customer.name}</p>
        </div>
      </div>
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
  deepAnalysisText,
  timelineEvents = [],
  threadEmails = [],
  onActivityEmailClick
}: CustomerContextPanelProps) {
  const aiInsightText =
    inboxContext.aiInsight || (threadSummary && threadSubject ? threadSummary : '');
  const analysisText = deepAnalysisText ?? inboxContext.deepAnalysis;

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='flex items-start gap-3 p-4'>
        <CustomerAvatar name={customer.name} avatarUrl={customer.avatarUrl} className='size-10' />
        <div className='min-w-0 flex-1'>
          <Link
            href={`/customers/${customer.id}`}
            className='hover:text-foreground/80 truncate font-semibold underline-offset-2 hover:underline'
          >
            {customer.company}
          </Link>
          <p className='text-muted-foreground truncate text-sm'>{customer.name}</p>
        </div>
      </div>

      <div className='flex-1 space-y-4 overflow-auto px-3 pb-4'>
        <InboxContextRailBody customer={customer} context={inboxContext} showDetails />
        {aiInsightText ? <InboxAiInsightCard text={aiInsightText} /> : null}
        {analysisText ? <InboxDeepAnalysisCard text={analysisText} /> : null}
        <InboxActivityCard
          events={timelineEvents}
          threadEmails={threadEmails}
          onEventClick={onActivityEmailClick}
        />
      </div>
    </div>
  );
}
