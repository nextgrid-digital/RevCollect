import PageContainer from '@/components/layout/page-container';
import { DashboardClient } from '@/features/revcollect/dashboard/components/dashboard-client';

export default function DashboardPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <DashboardClient />
    </PageContainer>
  );
}
