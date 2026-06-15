import PageContainer from '@/components/layout/page-container';
import { CustomersTable } from '@/features/revcollect/customers/components/customers-table';

export default function CustomersPage() {
  return (
    <PageContainer>
      <CustomersTable />
    </PageContainer>
  );
}
