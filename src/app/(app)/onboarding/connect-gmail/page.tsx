import PageContainer from '@/components/layout/page-container';
import { ConnectIntegrationView } from '@/features/revcollect/onboarding/components/connect-integration-view';

export default function ConnectGmailPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <ConnectIntegrationView
        title='Gmail'
        description='Connect the mailbox your team uses for customer outreach.'
        provider='Gmail'
      />
    </PageContainer>
  );
}
