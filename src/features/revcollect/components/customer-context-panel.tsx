import Link from 'next/link';
import type { ReactNode } from 'react';
import { CustomerAvatar } from './customer-avatar';
import { InboxActivityCard } from '../inbox/components/inbox-activity-card';
import { InboxContextRailBody } from '../inbox/components/inbox-context-rail-body';
import { InboxDeepAnalysisCard } from '../inbox/components/inbox-deep-analysis-card';
import type { Customer, CustomerInboxContext, ThreadEmail, TimelineEvent } from '../types';
import { RelationshipBadge } from './relationship-badge';

const XERO_PLACEHOLDER_EMAIL = 'no-email@xero.local';

function CustomerXeroEmail({ email }: { email: string }) {
  const trimmed = email.trim();
  const isMissing = !trimmed || trimmed.toLowerCase() === XERO_PLACEHOLDER_EMAIL;

  if (isMissing) {
    return <p className='text-muted-foreground truncate text-sm'>No email in Xero</p>;
  }

  return (
    <a
      href={`mailto:${trimmed}`}
      title={trimmed}
      className='text-muted-foreground hover:text-foreground/80 block truncate text-sm underline-offset-2 hover:underline'
    >
      {trimmed}
    </a>
  );
}

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

export function CustomerContextPanelFloatingHeader({
  customer,
  actions
}: {
  customer: Customer;
  actions?: ReactNode;
}) {
  return (
    <div className='space-y-2'>
      <div className='flex items-start gap-3'>
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
          <CustomerXeroEmail email={customer.email} />
          <div className='mt-1'>
            <RelationshipBadge customer={customer} />
          </div>
        </div>
        {actions ? <div className='shrink-0 self-start'>{actions}</div> : null}
      </div>
    </div>
  );
}

export function CustomerContextPanelFloatingBody({
  customer,
  inboxContext,
  aiInsightText = '',
  showDetails = false
}: {
  customer: Customer;
  inboxContext: CustomerInboxContext;
  aiInsightText?: string;
  showDetails?: boolean;
}) {
  return (
    <InboxContextRailBody
      customer={customer}
      context={inboxContext}
      aiInsightText={aiInsightText}
      showDetails={showDetails}
    />
  );
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
          <CustomerXeroEmail email={customer.email} />
          <div className='mt-1'>
            <RelationshipBadge customer={customer} />
          </div>
        </div>
      </div>

      <div className='flex-1 space-y-4 overflow-auto px-3 pb-4'>
        <InboxContextRailBody
          customer={customer}
          context={inboxContext}
          aiInsightText={aiInsightText}
          showDetails
        />
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
