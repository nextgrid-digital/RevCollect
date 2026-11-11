import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getRevCollectService } from '@/features/revcollect/api';
import { InboxMessagePageClient } from '@/features/revcollect/inbox/components/inbox-message-page-client';

interface InboxMessagePageProps {
  params: Promise<{ messageId: string }>;
}

export default async function InboxMessagePage({ params }: InboxMessagePageProps) {
  const { messageId } = await params;
  const selection = await getRevCollectService().getInboxSelectionData(messageId, { soft: true });
  if (!selection) notFound();

  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <Suspense fallback={<p className='text-muted-foreground p-4 text-sm'>Loading inbox…</p>}>
        <InboxMessagePageClient messageId={messageId} />
      </Suspense>
    </PageContainer>
  );
}
