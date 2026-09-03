import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/features/revcollect/legal/legal-page';

export const metadata: Metadata = {
  title: 'Connection ended — RevCollect',
  description: 'How to reconnect after disconnecting accounting.'
};

export default function DisconnectQuickBooksPage() {
  return (
    <LegalPage title='QuickBooks connection ended'>
      <p>
        This workspace is no longer connected to QuickBooks Online. Open invoices will not refresh
        until you reconnect.
      </p>
      <p>
        <Link className='underline underline-offset-4' href='/onboarding/connect-quickbooks'>
          Reconnect QuickBooks
        </Link>
        {' · '}
        <Link className='underline underline-offset-4' href='/settings/integrations'>
          Integrations
        </Link>
      </p>
    </LegalPage>
  );
}
