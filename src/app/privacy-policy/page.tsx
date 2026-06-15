import { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell, LegalSection } from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Privacy Policy | RevCollect',
  robots: { index: true }
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title='Privacy Policy' lastUpdated='June 2026'>
      <LegalSection title='Who we are'>
        <p>
          RevCollect is operated by Nextgrid Digital (&quot;RevCollect&quot;, &quot;we&quot;,
          &quot;us&quot;). We provide accounts-receivable collections follow-up software for small
          and mid-size businesses. When you use RevCollect, you are the{' '}
          <strong>data controller</strong> for your clients&apos; information; we act as your{' '}
          <strong>data processor</strong>.
        </p>
        <p>
          Privacy contact:{' '}
          <a href='mailto:privacy@revcollect.app' className='text-primary hover:underline'>
            privacy@revcollect.app
          </a>
        </p>
      </LegalSection>

      <LegalSection title='What data we process'>
        <ul className='list-disc space-y-2 pl-5'>
          <li>
            <strong>Contact information</strong> — names, email addresses, and phone numbers of your
            customers&apos; clients.
          </li>
          <li>
            <strong>Financial data</strong> — invoice amounts, payment history, outstanding
            balances, and aging status (synced from QuickBooks, Xero, or similar).
          </li>
          <li>
            <strong>Communication content</strong> — email subjects, bodies, and attachments sent or
            received through RevCollect.
          </li>
          <li>
            <strong>Behavioral metadata</strong> — when recipients respond, reply classification,
            and payment patterns used to prioritize follow-ups.
          </li>
          <li>
            <strong>Account data</strong> — your workspace name, team member names and emails (via
            Clerk), and billing information (via Stripe).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title='Why we process data'>
        <p>
          We process personal data solely to provide the collections follow-up service you signed up
          for: syncing invoices, drafting and sending follow-up emails, classifying replies, and
          surfacing account context. Lawful basis under GDPR: <strong>contractual necessity</strong>{' '}
          (Article 6(1)(b)).
        </p>
      </LegalSection>

      <LegalSection title='AI and automated decision-making'>
        <p>
          RevCollect uses large language models (Anthropic Claude and/or OpenAI GPT) to classify
          inbound replies and draft collection emails. Data is sent to these providers for a{' '}
          <strong>single inference request</strong> per action; it is not used to train or improve
          their models under our commercial API agreements.
        </p>
        <p>
          Under Australia&apos;s Privacy Act amendments, we disclose that substantially automated
          decision-making is used for reply classification, draft generation, and risk
          prioritization. You may contact us to request human review of a specific decision.
        </p>
      </LegalSection>

      <LegalSection title='Sub-processors'>
        <p>
          We share data with service providers who process it on our behalf. See our{' '}
          <Link href='/sub-processors' className='text-primary hover:underline'>
            sub-processor list
          </Link>{' '}
          for the current registry, including hosting (Vercel, Supabase), authentication (Clerk),
          email delivery (Resend or Postmark), payments (Stripe), and AI inference (Anthropic,
          OpenAI).
        </p>
      </LegalSection>

      <LegalSection title='Retention'>
        <ul className='list-disc space-y-2 pl-5'>
          <li>Active subscription: data retained for the duration of service.</li>
          <li>After cancellation: all personal data deleted within 30 days.</li>
          <li>
            Email bodies: automatically purged after 24 months unless you opt to retain longer in
            workspace settings.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title='Your rights'>
        <p>
          Depending on your location, you and your clients may have rights to access, correct,
          delete, or export personal data, and to object to certain processing. EU/UK controllers
          should use our{' '}
          <Link href='/legal/dpa' className='text-primary hover:underline'>
            Data Processing Agreement
          </Link>
          . Submit requests to{' '}
          <a href='mailto:privacy@revcollect.app' className='text-primary hover:underline'>
            privacy@revcollect.app
          </a>{' '}
          — we respond within 30 days.
        </p>
      </LegalSection>

      <LegalSection title='We do not sell personal data'>
        <p>
          RevCollect does not sell, rent, or share personal information with third parties for their
          marketing or commercial purposes.
        </p>
      </LegalSection>

      <LegalSection title='Security and breaches'>
        <p>
          See our{' '}
          <Link href='/security' className='text-primary hover:underline'>
            Security Practices
          </Link>{' '}
          page. If a breach affects your data, we will notify you and relevant authorities within 72
          hours where required by law.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
