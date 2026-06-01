'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  CustomerContextPanelFloatingBody,
  CustomerContextPanelFloatingHeader
} from '../../components/customer-context-panel';
import type { Customer, CustomerInboxContext, ThreadEmail, TimelineEvent } from '../../types';
import { InboxActivityCard } from './inbox-activity-card';
import { InboxAiInsightCard } from './inbox-ai-insight-card';
import { InboxEscalationCard } from './inbox-escalation-card';

interface InboxContextSidebarProps {
  showHeader?: boolean;
  customer: Customer;
  inboxContext: CustomerInboxContext;
  aiInsightText: string;
  escalationInsight?: string;
  timelineEvents: TimelineEvent[];
  threadEmails: ThreadEmail[];
  onActivityEmailClick: (emailId: string) => void;
}

function InboxContextSidebarComponent({
  showHeader = true,
  customer,
  inboxContext,
  aiInsightText,
  escalationInsight,
  timelineEvents,
  threadEmails,
  onActivityEmailClick
}: InboxContextSidebarProps) {
  return (
    <div className='flex h-full min-h-0 w-full flex-col'>
      {showHeader ? (
        <div className='border-border/60 shrink-0 border-b px-3 py-3'>
          <div className='overflow-hidden rounded-[16px] bg-white px-3 py-2 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'>
            <CustomerContextPanelFloatingHeader customer={customer} />
          </div>
        </div>
      ) : null}
      <div
        className={cn(
          'scroll-stable flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-4 pt-2'
        )}
      >
        <CustomerContextPanelFloatingBody customer={customer} inboxContext={inboxContext} />
        {aiInsightText ? (
          <div className='w-full shrink-0'>
            <InboxAiInsightCard text={aiInsightText} />
          </div>
        ) : null}
        {escalationInsight ? (
          <div className='w-full shrink-0'>
            <InboxEscalationCard text={escalationInsight} />
          </div>
        ) : null}
        <div className='w-full shrink-0'>
          <InboxActivityCard
            events={timelineEvents}
            threadEmails={threadEmails}
            onEventClick={onActivityEmailClick}
          />
        </div>
      </div>
    </div>
  );
}

export const InboxContextSidebar = memo(InboxContextSidebarComponent);
