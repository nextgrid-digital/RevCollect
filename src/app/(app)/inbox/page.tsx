import PageContainer from '@/components/layout/page-container';
import { InboxView } from '@/features/revcollect/inbox/components/inbox-view';

export default function InboxPage() {
  return (
    <PageContainer
      pageTitle='Inbox'
      pageDescription='Review customer replies and AI-drafted collection follow-ups.'
    >
      <InboxView />
    </PageContainer>
  );
}
