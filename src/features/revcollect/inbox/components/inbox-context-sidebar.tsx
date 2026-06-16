'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  CustomerContextPanelFloatingBody,
  CustomerContextPanelFloatingHeader
} from '../../components/customer-context-panel';
import type { Customer, CustomerInboxContext } from '../../types';
import { InboxContextActionsCard } from './inbox-context-actions-card';
import { InboxOpenModeMenu } from './inbox-open-mode-menu';

interface InboxContextSidebarProps {
  customer: Customer;
  inboxContext: CustomerInboxContext;
  aiInsightText: string;
  hasAgentDraft?: boolean;
  attachedInvoiceCount?: number;
  heroActionPresent?: boolean;
}

function InboxContextSidebarComponent({
  customer,
  inboxContext,
  aiInsightText,
  hasAgentDraft = false,
  attachedInvoiceCount = 0,
  heroActionPresent = false
}: InboxContextSidebarProps) {
  return (
    <div className='flex h-full min-h-0 w-full flex-col'>
      <div
        className={cn(
          'scroll-stable flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-4 pt-3'
        )}
      >
        <CustomerContextPanelFloatingHeader customer={customer} actions={<InboxOpenModeMenu />} />
        <CustomerContextPanelFloatingBody
          customer={customer}
          inboxContext={inboxContext}
          aiInsightText={aiInsightText}
          showDetails={false}
        />
        <InboxContextActionsCard
          contactName={customer.name}
          attachedInvoiceCount={attachedInvoiceCount}
          hasAgentDraft={hasAgentDraft}
          heroActionPresent={heroActionPresent}
        />
      </div>
    </div>
  );
}

export const InboxContextSidebar = memo(InboxContextSidebarComponent);
