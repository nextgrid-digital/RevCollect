'use client';

import type { AgentConfig, CollectionStatus } from '../../types';
import { InboxReplyComposer } from './inbox-reply-composer';

interface InboxFloatingComposerProps {
  draft: string;
  customerStatus: CollectionStatus;
  defaultTone?: AgentConfig['tone'];
}

export function InboxFloatingComposer({
  draft,
  customerStatus,
  defaultTone
}: InboxFloatingComposerProps) {
  return (
    <div id='inbox-thread-composer'>
      <InboxReplyComposer
        baseDraft={draft}
        customerStatus={customerStatus}
        defaultTone={defaultTone}
      />
    </div>
  );
}
