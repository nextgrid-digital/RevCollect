import PageContainer from '@/components/layout/page-container';
import { SettingsPageLayout } from '@/features/revcollect/settings/components/settings-page-layout';

export default function SettingsIntegrationsPage() {
  return (
    <PageContainer>
      <SettingsPageLayout tab='integrations' />
    </PageContainer>
  );
}
