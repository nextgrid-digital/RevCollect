import PageContainer from '@/components/layout/page-container';
import { SettingsPageLayout } from '@/features/revcollect/settings/components/settings-page-layout';

export default function SettingsIntegrationsPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <SettingsPageLayout tab='integrations' />
    </PageContainer>
  );
}
