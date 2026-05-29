import PageContainer from '@/components/layout/page-container';
import { InboxView } from '@/features/revcollect/inbox/components/inbox-view';

export default function InboxPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop>
      <InboxView />
    </PageContainer>
  );
}
