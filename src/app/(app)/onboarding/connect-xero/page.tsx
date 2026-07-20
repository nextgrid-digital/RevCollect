import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { ConnectXeroView } from '@/features/revcollect/onboarding/components/connect-xero-view';

export default function ConnectXeroPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <Suspense fallback={null}>
        <ConnectXeroView nextStep={{ href: '/inbox', label: 'Go to inbox' }} />
      </Suspense>
    </PageContainer>
  );
}
