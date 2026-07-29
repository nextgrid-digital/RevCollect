import PageContainer from '@/components/layout/page-container';
import { ImportInvoicesView } from '@/features/revcollect/invoice-import/components/import-invoices-view';

export default function ImportInvoicesPage() {
  return (
    <PageContainer compactMobile lockPageScroll flushTop flushX>
      <ImportInvoicesView />
    </PageContainer>
  );
}
