import PageContainer from '@/components/layout/page-container';
import { AgentConfigForm } from '@/features/revcollect/agent/components/agent-config-form';

export default function AgentPage() {
  return (
    <PageContainer>
      <AgentConfigForm />
    </PageContainer>
  );
}
