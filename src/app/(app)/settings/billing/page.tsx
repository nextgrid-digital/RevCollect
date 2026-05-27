import PageContainer from '@/components/layout/page-container';
import { SettingsBillingView } from '@/features/revcollect/settings/components/settings-billing-view';

export default function SettingsBillingPage() {
  return (
    <PageContainer
      pageTitle='Billing'
      pageDescription='Plan, usage, and payment method.'
    >
      <SettingsBillingView />
    </PageContainer>
  );
}
