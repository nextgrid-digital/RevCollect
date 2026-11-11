import type { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { CustomersWorkspace } from '@/features/revcollect/customers/components/customers-workspace';

export const metadata: Metadata = {
  title: 'Customers'
};

export default function CustomersPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <CustomersWorkspace />
    </PageContainer>
  );
}
