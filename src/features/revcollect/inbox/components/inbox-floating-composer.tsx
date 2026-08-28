'use client';

import type { AgentConfig, CollectionStatus } from '../../types';
import { InboxReplyComposer } from './inbox-reply-composer';

interface InboxFloatingComposerProps {
  draft: string;
  customerStatus: CollectionStatus;
  customerId: string;
  defaultTone?: AgentConfig['tone'];
  autoFocus?: boolean;
}

export function InboxFloatingComposer({
  draft,
  customerStatus,
  customerId,
  defaultTone,
  autoFocus = false
}: InboxFloatingComposerProps) {
  return (
    <div id='inbox-thread-composer'>
      <InboxReplyComposer
        baseDraft={draft}
        customerStatus={customerStatus}
        customerId={customerId}
        defaultTone={defaultTone}
        autoFocus={autoFocus}
      />
    </div>
  );
}
