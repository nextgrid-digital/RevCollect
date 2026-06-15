import PageContainer from '@/components/layout/page-container';
import { AgingView } from '@/features/revcollect/aging/components/aging-view';

export default function AgingPage() {
  return (
    <PageContainer compactMobile>
      <AgingView />
    </PageContainer>
  );
}
