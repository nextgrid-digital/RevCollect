'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileWorkspaceBar } from '@/components/layout/mobile-workspace-bar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInboxOpenMode } from '@/features/revcollect/inbox/components/inbox-open-mode-context';
import { InboxThreadDetail } from '@/features/revcollect/inbox/components/inbox-thread-detail';
import { InboxWorkspace } from '@/features/revcollect/inbox/components/inbox-workspace';

interface InboxMessagePageClientProps {
  messageId: string;
}

export function InboxMessagePageClient({ messageId }: InboxMessagePageClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { mode, openMessage } = useInboxOpenMode();

  useEffect(() => {
    if (mode === 'side' || mode === 'center') {
      openMessage(messageId);
      router.replace('/inbox', { scroll: false });
    }
  }, [messageId, mode, openMessage, router]);

  if (mode === 'workspace') {
    return <InboxWorkspace messageId={messageId} />;
  }

  if (mode === 'full') {
    if (isMobile) {
      return (
        <div className='flex h-full min-h-0 flex-col overflow-hidden'>
          <MobileWorkspaceBar backHref='/inbox' backLabel='Inbox' />
          <InboxThreadDetail messageId={messageId} variant='full' className='min-h-0 flex-1' />
        </div>
      );
    }

    return <InboxThreadDetail messageId={messageId} variant='full' className='h-full min-h-0' />;
  }

  return null;
}
