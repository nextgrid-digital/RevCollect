'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { InboxThreadDetail } from './inbox-thread-detail';
import { focusInboxComposer } from '../lib/focus-inbox-composer';
import { scrollInboxReplyTargetAfterLayout } from '../lib/scroll-inbox-reply-target';

interface InboxPeekCenterDialogProps {
  messageId: string | null;
  onClose: () => void;
}

export function InboxPeekCenterDialog({ messageId, onClose }: InboxPeekCenterDialogProps) {
  return (
    <Dialog open={messageId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          void scrollInboxReplyTargetAfterLayout().then((scrolledToDraft) => {
            if (!scrolledToDraft) {
              focusInboxComposer();
            }
          });
        }}
        className='flex h-[min(92vh,56rem)] w-[min(96vw,88rem)] max-h-[min(92vh,56rem)] max-w-[min(96vw,88rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,88rem)]'
      >
        <DialogHeader className='sr-only'>
          <DialogTitle>Email thread</DialogTitle>
          <DialogDescription>Collection thread preview</DialogDescription>
        </DialogHeader>
        {messageId ? (
          <InboxThreadDetail
            messageId={messageId}
            variant='peek'
            peekLayout='center'
            onClose={onClose}
            className='h-full'
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
