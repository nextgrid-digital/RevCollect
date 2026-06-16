import PageContainer from '@/components/layout/page-container';
import { CustomersWorkspace } from '@/features/revcollect/customers/components/customers-workspace';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <CustomersWorkspace customerId={id} />
    </PageContainer>
  );
}
