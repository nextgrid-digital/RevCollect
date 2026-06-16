'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInboxOpenMode } from '@/features/revcollect/inbox/components/inbox-open-mode-context';
import { InboxThreadDetail } from '@/features/revcollect/inbox/components/inbox-thread-detail';
import { InboxWorkspace } from '@/features/revcollect/inbox/components/inbox-workspace';

interface InboxMessagePageClientProps {
  messageId: string;
}

export function InboxMessagePageClient({ messageId }: InboxMessagePageClientProps) {
  const router = useRouter();
  const { mode, openMessage } = useInboxOpenMode();

  useEffect(() => {
    if (mode === 'side' || mode === 'center') {
      openMessage(messageId);
      router.replace('/inbox');
    }
  }, [messageId, mode, openMessage, router]);

  if (mode === 'workspace') {
    return <InboxWorkspace messageId={messageId} />;
  }

  if (mode === 'full') {
    return <InboxThreadDetail messageId={messageId} variant='full' className='h-full min-h-0' />;
  }

  return null;
}
