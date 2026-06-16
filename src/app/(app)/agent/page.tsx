import PageContainer from '@/components/layout/page-container';
import { AgentPage } from '@/features/revcollect/agent/components/agent-page';

export default function AgentPageRoute() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <AgentPage />
    </PageContainer>
  );
}
