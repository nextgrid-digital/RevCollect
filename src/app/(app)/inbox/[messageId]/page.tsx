import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { InboxMessagePageClient } from '@/features/revcollect/inbox/components/inbox-message-page-client';

interface InboxMessagePageProps {
  params: Promise<{ messageId: string }>;
}

export default async function InboxMessagePage({ params }: InboxMessagePageProps) {
  const { messageId } = await params;

  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <Suspense fallback={<p className='text-muted-foreground p-4 text-sm'>Loading inbox…</p>}>
        <InboxMessagePageClient messageId={messageId} />
      </Suspense>
    </PageContainer>
  );
}
