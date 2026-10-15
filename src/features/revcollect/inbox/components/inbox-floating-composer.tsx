'use client';

import type { AgentConfig, CollectionStatus, Customer } from '../../types';
import { InboxReplyComposer } from './inbox-reply-composer';

interface InboxFloatingComposerProps {
  draft: string;
  customerStatus: CollectionStatus;
  customerId: string;
  messageId?: string;
  customer?: Customer;
  defaultTone?: AgentConfig['tone'];
  autoFocus?: boolean;
}

export function InboxFloatingComposer({
  draft,
  customerStatus,
  customerId,
  messageId,
  customer,
  defaultTone,
  autoFocus = false
}: InboxFloatingComposerProps) {
  return (
    <div id='inbox-thread-composer-fields'>
      <InboxReplyComposer
        baseDraft={draft}
        customerStatus={customerStatus}
        customerId={customerId}
        messageId={messageId}
        customer={customer}
        defaultTone={defaultTone}
        autoFocus={autoFocus}
      />
    </div>
  );
}
