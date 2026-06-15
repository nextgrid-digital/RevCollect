'use client';

import type { AgentConfig, CollectionStatus } from '../../types';
import { InboxFloatingOverlay } from './inbox-floating-overlay';
import { InboxReplyComposer } from './inbox-reply-composer';

interface InboxFloatingComposerProps {
  draft: string;
  customerStatus: CollectionStatus;
  defaultTone?: AgentConfig['tone'];
  overlayClassName?: string;
  onOverlayHeightChange?: (height: number) => void;
}

export function InboxFloatingComposer({
  draft,
  customerStatus,
  defaultTone,
  overlayClassName,
  onOverlayHeightChange
}: InboxFloatingComposerProps) {
  return (
    <InboxFloatingOverlay
      className={overlayClassName}
      onHeightChange={onOverlayHeightChange}
      contentClassName='px-0 pb-0'
    >
      <InboxReplyComposer
        baseDraft={draft}
        customerStatus={customerStatus}
        defaultTone={defaultTone}
      />
    </InboxFloatingOverlay>
  );
}
