import PageContainer from '@/components/layout/page-container';
import { CustomersTable } from '@/features/revcollect/customers/components/customers-table';

export default function CustomersPage() {
  return (
    <PageContainer
      pageTitle='Customers'
      pageDescription='Accounts with open balances and collection status.'
    >
      <CustomersTable />
    </PageContainer>
  );
}
