import type { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { DashboardClient } from '@/features/revcollect/dashboard/components/dashboard-client';

export const metadata: Metadata = {
  title: 'Dashboard'
};

export default function DashboardPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <DashboardClient />
    </PageContainer>
  );
}
