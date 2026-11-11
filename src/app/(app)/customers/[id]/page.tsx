import PageContainer from '@/components/layout/page-container';
import { CustomersWorkspace } from '@/features/revcollect/customers/components/customers-workspace';
import { getRevCollectService } from '@/features/revcollect/api';
import { notFound } from 'next/navigation';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await getRevCollectService().getCustomerById(id);
  if (!customer) notFound();

  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <CustomersWorkspace customerId={id} />
    </PageContainer>
  );
}
