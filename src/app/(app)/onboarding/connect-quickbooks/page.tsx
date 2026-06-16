import PageContainer from '@/components/layout/page-container';
import { ConnectIntegrationView } from '@/features/revcollect/onboarding/components/connect-integration-view';

export default function ConnectQuickBooksPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <ConnectIntegrationView
        title='QuickBooks Online'
        description='Import open invoices, customers, and payment applications automatically.'
        provider='QuickBooks'
      />
    </PageContainer>
  );
}
