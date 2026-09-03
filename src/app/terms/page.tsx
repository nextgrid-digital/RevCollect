import type { Metadata } from 'next';
import { LegalPage } from '@/features/revcollect/legal/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service — RevCollect',
  description: 'Terms for using RevCollect.'
};

export default function TermsPage() {
  return (
    <LegalPage title='Terms of Service'>
      <p>
        RevCollect drafts collection follow-ups. You remain the sender. You are responsible for
        CAN-SPAM and similar rules, for the accuracy of your books, and for who you authorize to
        connect Xero, QuickBooks, Zoho Books, and Gmail.
      </p>
      <p>
        Accounting data stays in your ledger. RevCollect is not a substitute for your practice
        management, tax, or legal advice. Disconnecting a provider stops new syncs; stored workspace
        data follows our retention practices described in the privacy policy.
      </p>
      <p>
        The product name does not include “Xero”, “QuickBooks”, or “Zoho”. Those marks belong to
        their owners. Listing on a marketplace does not make RevCollect an official product of that
        vendor.
      </p>
      <p>Questions: hello@revcollect.ai.</p>
    </LegalPage>
  );
}
