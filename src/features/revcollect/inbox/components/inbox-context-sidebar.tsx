'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  CustomerContextPanelFloatingBody,
  CustomerContextPanelFloatingHeader
} from '../../components/customer-context-panel';
import type { Customer, CustomerInboxContext } from '../../types';
import { InboxAiInsightCard } from './inbox-ai-insight-card';
import { InboxContextActionsCard } from './inbox-context-actions-card';

interface InboxContextSidebarProps {
  customer: Customer;
  inboxContext: CustomerInboxContext;
  aiInsightText: string;
  hasAgentDraft?: boolean;
  attachedInvoiceCount?: number;
  onDraftFollowUp?: () => void;
}

function InboxContextSidebarComponent({
  customer,
  inboxContext,
  aiInsightText,
  hasAgentDraft = false,
  attachedInvoiceCount = 0,
  onDraftFollowUp
}: InboxContextSidebarProps) {
  return (
    <div className='flex h-full min-h-0 w-full flex-col'>
      <div
        className={cn(
          'scroll-stable flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-4 pt-3'
        )}
      >
        <CustomerContextPanelFloatingHeader customer={customer} />
        <CustomerContextPanelFloatingBody
          customer={customer}
          inboxContext={inboxContext}
          showDetails
        />
        <InboxContextActionsCard
          contactName={customer.name}
          attachedInvoiceCount={attachedInvoiceCount}
        />
        {aiInsightText ? (
          <div className='w-full shrink-0'>
            <InboxAiInsightCard
              text={aiInsightText}
              onDraftFollowUp={hasAgentDraft ? onDraftFollowUp : undefined}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const InboxContextSidebar = memo(InboxContextSidebarComponent);
