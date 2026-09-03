import type { Metadata } from 'next';
import { LegalPage } from '@/features/revcollect/legal/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy — RevCollect',
  description: 'How RevCollect handles accounting, Gmail, and workspace data.'
};

export default function PrivacyPage() {
  return (
    <LegalPage title='Privacy Policy'>
      <p>
        RevCollect is a collections workspace for bookkeepers. We sync open invoices, contacts, and
        payment status from the accounting system you connect (Xero, QuickBooks Online, or Zoho
        Books) and send mail only through the Gmail account you authorize.
      </p>
      <p>
        We use that data to show your inbox, draft follow-ups you review, and record what you sent.
        We do not sell customer lists. We do not use Xero, Intuit, or Zoho API data to train or
        fine-tune machine learning models. AI drafts are inference-only.
      </p>
      <p>
        Tokens are stored encrypted per workspace. You can disconnect a provider in Settings. If you
        revoke access in Xero, Intuit, or Zoho, the next sync fails until you reconnect.
      </p>
      <p>
        Support: hello@revcollect.ai. Related:{' '}
        <a className='underline underline-offset-4' href='/terms'>
          Terms
        </a>
        ,{' '}
        <a className='underline underline-offset-4' href='/security'>
          Security
        </a>
        ,{' '}
        <a className='underline underline-offset-4' href='/sub-processors'>
          Sub-processors
        </a>
        .
      </p>
    </LegalPage>
  );
}
