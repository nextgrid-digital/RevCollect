import PageContainer from '@/components/layout/page-container';
import { CustomerDetailView } from '@/features/revcollect/customers/components/customer-detail-view';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <CustomerDetailView customerId={id} />
    </PageContainer>
  );
}
