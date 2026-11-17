import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LegalPage } from '@/features/revcollect/legal/legal-page';
import { disconnectQuickBooks } from '@/lib/integrations/disconnect-integration';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';

export const metadata: Metadata = {
  title: 'QuickBooks Online connection ended',
  description: 'How to reconnect after disconnecting accounting.'
};

export default async function DisconnectQuickBooksPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const done = params.done === '1';
  const userId = await getAuthUserId();

  if (userId && !done) {
    const tenantId = await getIntegrationTenantId();
    await disconnectQuickBooks(tenantId);
    redirect('/disconnect/quickbooks?done=1');
  }

  return (
    <LegalPage title='QuickBooks connection ended'>
      {done ? (
        <p>
          QuickBooks is disconnected. The token was revoked and sync has stopped. Invoices already
          saved stay until you request deletion under Settings → Privacy and data. That emails
          admin@revcollect.ai.
        </p>
      ) : (
        <p>
          Sign in and open this page again to revoke the saved QuickBooks token and remove the
          connection from your workspace.
        </p>
      )}
      <p>
        <Link className='underline underline-offset-4' href='/onboarding/connect-quickbooks'>
          Connect to QuickBooks
        </Link>
        {' · '}
        <Link className='underline underline-offset-4' href='/settings/integrations'>
          Integrations
        </Link>
        {' · '}
        <Link className='underline underline-offset-4' href='/help/quickbooks'>
          Help
        </Link>
      </p>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        Intuit and QuickBooks are registered trademarks of Intuit Inc. Used with permission.
      </p>
    </LegalPage>
  );
}
