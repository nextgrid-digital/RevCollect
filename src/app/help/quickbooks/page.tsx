import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/features/revcollect/legal/legal-page';

export const metadata: Metadata = {
  title: 'Connect QuickBooks Online — RevCollect Help',
  description:
    'How to connect QuickBooks Online, sync open AR, send from Gmail, and disconnect.'
};

export default function QuickBooksHelpPage() {
  return (
    <LegalPage title='Connect QuickBooks Online'>
      <p>
        RevCollect is a collections inbox for bookkeepers. Connect QuickBooks Online to sync
        customers and open invoices, draft follow-ups, and send from Gmail when you approve. We do
        not auto-email your clients. QuickBooks Online stays your books.
      </p>

      <h2 className='text-foreground pt-2 text-base font-medium'>1. Sign in</h2>
      <p>
        Open{' '}
        <Link className='underline underline-offset-4' href='/login'>
          app.revcollect.ai/login
        </Link>{' '}
        and sign in (or{' '}
        <Link className='underline underline-offset-4' href='/signup'>
          create an account
        </Link>
        ).
      </p>

      <h2 className='text-foreground pt-2 text-base font-medium'>2. Connect QuickBooks Online</h2>
      <p>
        Go to{' '}
        <Link className='underline underline-offset-4' href='/onboarding/connect-quickbooks'>
          Connect QuickBooks
        </Link>{' '}
        (or Settings → Integrations). Authorize RevCollect. We request accounting scopes needed for
        customers and open AR only.
      </p>

      <h2 className='text-foreground pt-2 text-base font-medium'>3. Connect Gmail</h2>
      <p>
        Collection email is sent through your Gmail account. Connect Gmail under Settings →
        Integrations. You review every draft before send.
      </p>

      <h2 className='text-foreground pt-2 text-base font-medium'>4. Follow up on open invoices</h2>
      <p>
        Open Inbox, pick a customer or thread, review the draft, and send. Open invoice context stays
        alongside the conversation.
      </p>

      <h2 className='text-foreground pt-2 text-base font-medium'>5. Disconnect</h2>
      <p>
        Use Integrations → Disconnect, or open{' '}
        <Link className='underline underline-offset-4' href='/disconnect/quickbooks'>
          Disconnect QuickBooks
        </Link>
        . Sync stops until you reconnect.
      </p>

      <h2 className='text-foreground pt-2 text-base font-medium'>Pricing</h2>
      <p>
        30-day trial with no credit card. Then $49 USD/month for the workspace, plus $39 USD/month
        if you keep the agent. Unpaid workspaces become read-only.
      </p>

      <h2 className='text-foreground pt-2 text-base font-medium'>Support</h2>
      <p>
        Email{' '}
        <a className='underline underline-offset-4' href='mailto:hello@revcollect.ai'>
          hello@revcollect.ai
        </a>
        . Privacy:{' '}
        <Link className='underline underline-offset-4' href='/privacy'>
          Privacy
        </Link>
        {' · '}
        <Link className='underline underline-offset-4' href='/security'>
          Security
        </Link>
        .
      </p>

      <p className='text-muted-foreground pt-4 text-xs leading-relaxed'>
        Intuit and QuickBooks are registered trademarks of Intuit Inc. Used with permission.
      </p>
    </LegalPage>
  );
}
