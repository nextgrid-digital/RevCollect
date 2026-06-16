'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  CustomerContextPanelFloatingBody,
  CustomerContextPanelFloatingHeader
} from '../../components/customer-context-panel';
import type { Customer, CustomerInboxContext, ThreadEmail, TimelineEvent } from '../../types';
import { InboxActivityCard } from './inbox-activity-card';

interface InboxContextSidebarProps {
  customer: Customer;
  inboxContext: CustomerInboxContext;
  aiInsightText: string;
  timelineEvents?: TimelineEvent[];
  threadEmails?: ThreadEmail[];
  onActivityEmailClick?: (emailId: string) => void;
}

function InboxContextSidebarComponent({
  customer,
  inboxContext,
  aiInsightText,
  timelineEvents = [],
  threadEmails = [],
  onActivityEmailClick
}: InboxContextSidebarProps) {
  return (
    <div className='flex h-full min-h-0 w-full flex-col'>
      <div
        className={cn(
          'scroll-stable flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4'
        )}
      >
        <div className='flex flex-col gap-4'>
          <CustomerContextPanelFloatingHeader customer={customer} />
          <CustomerContextPanelFloatingBody
            customer={customer}
            inboxContext={inboxContext}
            aiInsightText={aiInsightText}
            showDetails={false}
          />
          {timelineEvents.length > 0 ? (
            <InboxActivityCard
              events={timelineEvents}
              threadEmails={threadEmails}
              onEventClick={onActivityEmailClick}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const InboxContextSidebar = memo(InboxContextSidebarComponent);
