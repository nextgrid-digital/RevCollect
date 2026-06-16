import PageContainer from '@/components/layout/page-container';
import { InboxMessagePageClient } from '@/features/revcollect/inbox/components/inbox-message-page-client';

interface InboxMessagePageProps {
  params: Promise<{ messageId: string }>;
}

export default async function InboxMessagePage({ params }: InboxMessagePageProps) {
  const { messageId } = await params;

  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <InboxMessagePageClient messageId={messageId} />
    </PageContainer>
  );
}
