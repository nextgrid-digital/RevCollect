import PageContainer from '@/components/layout/page-container';
import { CustomersWorkspace } from '@/features/revcollect/customers/components/customers-workspace';

export default function CustomersPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <CustomersWorkspace />
    </PageContainer>
  );
}
