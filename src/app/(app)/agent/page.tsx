import PageContainer from '@/components/layout/page-container';
import { AgentConfigForm } from '@/features/revcollect/agent/components/agent-config-form';

export default function AgentPage() {
  return (
    <PageContainer
      pageTitle='Agent'
      pageDescription='Configure how the AI collection agent drafts and escalates outreach.'
    >
      <AgentConfigForm />
    </PageContainer>
  );
}
