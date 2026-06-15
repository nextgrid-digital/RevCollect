import PageContainer from '@/components/layout/page-container';
import { InboxThreadDetail } from '@/features/revcollect/inbox/components/inbox-thread-detail';

interface InboxMessagePageProps {
  params: Promise<{ messageId: string }>;
}

export default async function InboxMessagePage({ params }: InboxMessagePageProps) {
  const { messageId } = await params;

  return (
    <PageContainer compactMobile lockPageScroll flushTop>
      <div className='flex max-h-[calc(100dvh-var(--header-height)-1rem)] min-h-0 w-full flex-1 flex-col overflow-hidden'>
        <InboxThreadDetail messageId={messageId} variant='full' />
      </div>
    </PageContainer>
  );
}
