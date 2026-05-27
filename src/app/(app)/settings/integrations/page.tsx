import PageContainer from '@/components/layout/page-container';
import { SettingsIntegrationsView } from '@/features/revcollect/settings/components/settings-integrations-view';

export default function SettingsIntegrationsPage() {
  return (
    <PageContainer
      pageTitle='Integrations'
      pageDescription='Connect accounting, email, and payments.'
    >
      <SettingsIntegrationsView />
    </PageContainer>
  );
}
