import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { ConnectXeroView } from '@/features/revcollect/onboarding/components/connect-xero-view';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';

export default function ConnectXeroPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <Suspense fallback={null}>
        <ConnectXeroView nextStep={{ href: POST_LOGIN_PATH, label: 'Open dashboard' }} />
      </Suspense>
    </PageContainer>
  );
}
