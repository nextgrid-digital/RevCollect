import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/features/revcollect/legal/legal-page';

export const metadata: Metadata = {
  title: 'Connection ended — RevCollect',
  description: 'How to reconnect after disconnecting Xero.'
};

export default function DisconnectXeroPage() {
  return (
    <LegalPage title='Xero connection ended'>
      <p>
        Access was disconnected or revoked (including from Xero → Connected Apps). Reconnect with
        Xero to resume invoice sync.
      </p>
      <p>
        <Link className='underline underline-offset-4' href='/onboarding/connect-xero'>
          Connect with Xero
        </Link>
        {' · '}
        <Link className='underline underline-offset-4' href='/settings/integrations'>
          Integrations
        </Link>
      </p>
    </LegalPage>
  );
}
