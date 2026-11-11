import type { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { InboxView } from '@/features/revcollect/inbox/components/inbox-view';

export const metadata: Metadata = {
  title: 'Inbox'
};

export default function InboxPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <InboxView />
    </PageContainer>
  );
}
