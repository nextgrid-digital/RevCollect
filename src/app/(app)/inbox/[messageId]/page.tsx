import PageContainer from '@/components/layout/page-container';
import { InboxWorkspace } from '@/features/revcollect/inbox/components/inbox-workspace';

interface InboxMessagePageProps {
  params: Promise<{ messageId: string }>;
}

export default async function InboxMessagePage({ params }: InboxMessagePageProps) {
  const { messageId } = await params;

  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <InboxWorkspace messageId={messageId} />
    </PageContainer>
  );
}
