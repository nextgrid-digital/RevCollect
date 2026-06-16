import PageContainer from '@/components/layout/page-container';
import { SettingsPageLayout } from '@/features/revcollect/settings/components/settings-page-layout';

export default function SettingsBillingPage() {
  return (
    <PageContainer lockPageScroll>
      <SettingsPageLayout tab='billing' />
    </PageContainer>
  );
}
