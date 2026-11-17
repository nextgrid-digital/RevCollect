import { LegalPage } from '@/features/revcollect/legal/legal-page';
import { publicMetadata } from '@/lib/site';

const PRIVACY_POLICY_URL = 'https://revcollect.ai/security/privacy-policy';

export const metadata = publicMetadata({
  title: 'Privacy Policy',
  description: 'How RevCollect handles accounting, Gmail, and workspace data.',
  path: '/privacy'
});

export default function PrivacyPage() {
  return (
    <LegalPage title='Privacy Policy'>
      <p>
        The privacy policy is published at{' '}
        <a className='underline underline-offset-4' href={PRIVACY_POLICY_URL}>
          revcollect.ai/security/privacy-policy
        </a>
        .
      </p>
      <p>
        Disconnect from QuickBooks revokes the token and stops new syncs. The last snapshot of
        customers, invoices, and payments stays until you ask us to delete it. Sign in and choose
        Settings → Privacy and data → Request data deletion. That emails admin@revcollect.ai and
        asks us to delete that workspace&apos;s stored books, payments, and sent collection mail,
        and to revoke Xero, Zoho, and Gmail. The subscription record stays. You can also email{' '}
        <a className='underline underline-offset-4' href='mailto:admin@revcollect.ai'>
          admin@revcollect.ai
        </a>
        . Requests sent by email are completed within 30 days.
      </p>
      <p className='text-muted-foreground pt-4 text-xs leading-relaxed'>
        Intuit and QuickBooks are registered trademarks of Intuit Inc. Used with permission.
      </p>
    </LegalPage>
  );
}
