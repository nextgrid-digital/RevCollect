import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { ConnectGmailView } from '@/features/revcollect/onboarding/components/connect-gmail-view';

export default function ConnectGmailPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <Suspense fallback={null}>
        <ConnectGmailView
          nextStep={{
            href: '/onboarding/connect-xero',
            label: 'Connect Xero'
          }}
        />
      </Suspense>
    </PageContainer>
  );
}
