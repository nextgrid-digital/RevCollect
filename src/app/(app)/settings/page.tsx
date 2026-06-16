import PageContainer from '@/components/layout/page-container';
import { SettingsPageLayout } from '@/features/revcollect/settings/components/settings-page-layout';

export default function SettingsPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <SettingsPageLayout tab='general' />
    </PageContainer>
  );
}
