'use client';

import { Suspense } from 'react';
import { useInboxOpenMode } from '@/features/revcollect/inbox/components/inbox-open-mode-context';
import { InboxNotionView } from '@/features/revcollect/inbox/components/inbox-notion-view';
import { InboxWorkspace } from '@/features/revcollect/inbox/components/inbox-workspace';

function InboxViewContent() {
  const { mode } = useInboxOpenMode();

  if (mode === 'workspace') {
    return <InboxWorkspace />;
  }

  return <InboxNotionView />;
}

export function InboxView() {
  return (
    <Suspense fallback={<p className='text-muted-foreground p-4 text-sm'>Loading inbox…</p>}>
      <InboxViewContent />
    </Suspense>
  );
}
