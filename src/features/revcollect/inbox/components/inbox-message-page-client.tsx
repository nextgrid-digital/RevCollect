'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInboxOpenMode } from '@/features/revcollect/inbox/components/inbox-open-mode-context';
import { InboxThreadDetail } from '@/features/revcollect/inbox/components/inbox-thread-detail';
import { InboxWorkspace } from '@/features/revcollect/inbox/components/inbox-workspace';
import { preserveInboxListQueryPath } from '@/features/revcollect/inbox/lib/inbox-list-query';

interface InboxMessagePageClientProps {
  messageId: string;
}

export function InboxMessagePageClient({ messageId }: InboxMessagePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { mode, openMessage } = useInboxOpenMode();

  useEffect(() => {
    if (isMobile) return;
    if (mode === 'side' || mode === 'center') {
      openMessage(messageId);
      router.replace(preserveInboxListQueryPath(null, searchParams), { scroll: false });
    }
  }, [isMobile, messageId, mode, openMessage, router, searchParams]);

  if (isMobile || mode === 'workspace') {
    return <InboxWorkspace messageId={messageId} />;
  }

  if (mode === 'full') {
    return <InboxThreadDetail messageId={messageId} variant='full' className='h-full min-h-0' />;
  }

  return null;
}
