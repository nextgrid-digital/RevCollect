import PageContainer from '@/components/layout/page-container';
import { SettingsGeneralView } from '@/features/revcollect/settings/components/settings-general-view';

export default function SettingsPage() {
  return (
    <PageContainer
      pageTitle='Settings'
      pageDescription='Workspace and collection preferences.'
    >
      <SettingsGeneralView />
    </PageContainer>
  );
}
