import type { Metadata } from 'next';
import { LegalPage } from '@/features/revcollect/legal/legal-page';

export const metadata: Metadata = {
  title: 'Security — RevCollect',
  description: 'How RevCollect protects workspace and integration data.'
};

export default function SecurityPage() {
  return (
    <LegalPage title='Security'>
      <p>
        Workspaces are isolated by authenticated user id. Integration refresh tokens are encrypted
        at rest. Dashboard routes require a session. Cron ingest uses a shared secret.
      </p>
      <p>
        We request the minimum accounting scopes needed for open AR: contacts/customers, invoices,
        payments, and (on Xero) aged receivables. We do not request Xero accounting.transactions.
      </p>
      <p>
        Incidents affecting ingest or send: email hello@revcollect.ai. We will tell affected
        workspaces what failed and how to reconnect.
      </p>
    </LegalPage>
  );
}
