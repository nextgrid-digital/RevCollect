'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useInboxSelectionData } from '../hooks/use-inbox-selection-data';
import { InboxPeekHeaderBar } from './inbox-peek-header-bar';
import { InboxThreadDetail } from './inbox-thread-detail';

interface InboxPeekCenterDialogProps {
  messageId: string | null;
  onClose: () => void;
}

export function InboxPeekCenterDialog({ messageId, onClose }: InboxPeekCenterDialogProps) {
  const { data: selection } = useInboxSelectionData(messageId);

  return (
    <Dialog open={messageId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        className='flex h-[min(88vh,48rem)] w-full max-h-[min(88vh,48rem)] max-w-[min(56rem,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(56rem,calc(100vw-2rem))]'
      >
        <DialogHeader className='sr-only'>
          <DialogTitle>Email thread</DialogTitle>
          <DialogDescription>Collection thread preview</DialogDescription>
        </DialogHeader>
        {messageId ? (
          <>
            {selection ? (
              <InboxPeekHeaderBar
                customer={selection.customer}
                subject={selection.message.subject}
                agentDraftMeta={selection.agentDraftMeta}
                unread={selection.message.unread}
              />
            ) : null}
            <div className='min-h-0 flex-1 overflow-hidden'>
              <InboxThreadDetail
                messageId={messageId}
                variant='peek'
                peekLayout='center'
                onClose={onClose}
                className='h-full'
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
