'use client';

import type { ReactNode } from 'react';
import type { AgentDraftMeta, Customer } from '../../types';
import { InboxThreadHeader } from './inbox-thread-header';

interface InboxPeekHeaderBarProps {
  customer: Customer;
  subject: string;
  agentDraftMeta?: AgentDraftMeta;
  unread: boolean;
  trailing?: ReactNode;
}

export function InboxPeekHeaderBar({
  customer,
  subject,
  agentDraftMeta,
  unread,
  trailing
}: InboxPeekHeaderBarProps) {
  return (
    <div className='border-border/60 flex shrink-0 items-center gap-3 border-b px-3 py-2'>
      <div className='min-w-0 flex-1'>
        <InboxThreadHeader
          customer={customer}
          subject={subject}
          agentDraftMeta={agentDraftMeta}
          unread={unread}
          className='py-0'
        />
      </div>
      {trailing}
    </div>
  );
}
