import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { ConnectBooksView } from '@/features/revcollect/onboarding/components/connect-books-view';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';

export default function ConnectZohoPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <Suspense fallback={null}>
        <ConnectBooksView
          provider='zoho'
          nextStep={{ href: POST_LOGIN_PATH, label: 'Open dashboard' }}
        />
      </Suspense>
    </PageContainer>
  );
}
