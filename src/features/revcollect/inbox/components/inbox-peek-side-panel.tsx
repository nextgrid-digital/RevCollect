'use client';

import { cn } from '@/lib/utils';
import { InboxThreadDetail } from './inbox-thread-detail';

interface InboxPeekSidePanelProps {
  messageId: string;
  onClose: () => void;
}

export function InboxPeekSidePanel({ messageId, onClose }: InboxPeekSidePanelProps) {
  return (
    <aside
      className={cn(
        'border-border/60 bg-background fixed top-0 right-0 z-30 flex h-svh w-[min(92vw,72rem)] flex-col overflow-hidden border-l shadow-xl',
        'animate-in slide-in-from-right fade-in-0 duration-300'
      )}
    >
      <InboxThreadDetail messageId={messageId} variant='peek' onClose={onClose} />
    </aside>
  );
}
