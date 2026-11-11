import type { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { AgingView } from '@/features/revcollect/aging/components/aging-view';

export const metadata: Metadata = {
  title: 'Aging'
};

export default function AgingPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <AgingView />
    </PageContainer>
  );
}
