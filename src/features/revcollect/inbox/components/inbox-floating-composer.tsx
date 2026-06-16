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
      id='inbox-thread-composer'
      className={
        overlayClassName ??
        'border-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-6'
      }
      onHeightChange={onOverlayHeightChange}
      contentClassName='px-0 pb-0'
    >
      <div className='px-4 pb-3'>
        <InboxReplyComposer
          baseDraft={draft}
          customerStatus={customerStatus}
          defaultTone={defaultTone}
        />
      </div>
    </InboxFloatingOverlay>
  );
}
