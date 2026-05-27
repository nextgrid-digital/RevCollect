import PageContainer from '@/components/layout/page-container';
import { AgingView } from '@/features/revcollect/aging/components/aging-view';

export default function AgingPage() {
  return (
    <PageContainer
      pageTitle='Aging report'
      pageDescription='Outstanding AR by aging bucket.'
    >
      <AgingView />
    </PageContainer>
  );
}
