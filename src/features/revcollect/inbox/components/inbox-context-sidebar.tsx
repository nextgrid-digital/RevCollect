'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { CustomerContextPanelFloatingBody } from '../../components/customer-context-panel';
import type { Customer, CustomerInboxContext } from '../../types';
import { InboxAiInsightCard } from './inbox-ai-insight-card';
import { InboxContextActionsCard } from './inbox-context-actions-card';
import { InboxDeepAnalysisCard } from './inbox-deep-analysis-card';

interface InboxContextSidebarProps {
  customer: Customer;
  inboxContext: CustomerInboxContext;
  aiInsightText: string;
  deepAnalysisText?: string;
}

function InboxContextSidebarComponent({
  customer,
  inboxContext,
  aiInsightText,
  deepAnalysisText
}: InboxContextSidebarProps) {
  return (
    <div className='flex h-full min-h-0 w-full flex-col'>
      <div
        className={cn(
          'scroll-stable flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-4 pt-3'
        )}
      >
        <CustomerContextPanelFloatingBody customer={customer} inboxContext={inboxContext} />
        {aiInsightText ? (
          <div className='w-full shrink-0'>
            <InboxAiInsightCard text={aiInsightText} />
          </div>
        ) : null}
        {deepAnalysisText ? (
          <div className='w-full shrink-0'>
            <InboxDeepAnalysisCard text={deepAnalysisText} />
          </div>
        ) : null}
        <InboxContextActionsCard contactName={customer.name} source={inboxContext.source} />
      </div>
    </div>
  );
}

export const InboxContextSidebar = memo(InboxContextSidebarComponent);
