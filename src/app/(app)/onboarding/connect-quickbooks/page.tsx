import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { ConnectBooksView } from '@/features/revcollect/onboarding/components/connect-books-view';
import { POST_LOGIN_PATH } from '@/lib/auth-paths';

export default function ConnectQuickBooksPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <Suspense fallback={null}>
        <ConnectBooksView
          provider='quickbooks'
          nextStep={{ href: POST_LOGIN_PATH, label: 'Open dashboard' }}
        />
      </Suspense>
    </PageContainer>
  );
}
