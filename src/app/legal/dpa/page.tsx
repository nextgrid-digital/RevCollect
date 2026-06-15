import { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell, LegalSection } from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Data Processing Agreement | RevCollect',
  robots: { index: true }
};

export default function DpaPage() {
  return (
    <LegalPageShell title='Data Processing Agreement (DPA)' lastUpdated='June 2026'>
      <LegalSection title='Agreement'>
        <p>
          This Data Processing Agreement (&quot;DPA&quot;) forms part of the agreement between
          Nextgrid Digital, operating RevCollect (&quot;Processor&quot;), and the customer entity
          that accepts RevCollect&apos;s Terms of Service (&quot;Controller&quot;). It applies when
          the Controller processes personal data subject to the GDPR, UK GDPR, or similar laws and
          uses RevCollect to process that data on the Controller&apos;s behalf.
        </p>
      </LegalSection>

      <LegalSection title='Subject matter and duration'>
        <p>
          Processor will process personal data only to provide the RevCollect collections follow-up
          service for the duration of the subscription and for up to 30 days after termination for
          data export and deletion, unless law requires longer retention.
        </p>
      </LegalSection>

      <LegalSection title='Nature and purpose of processing'>
        <ul className='list-disc space-y-2 pl-5'>
          <li>Syncing invoice and contact data from accounting integrations.</li>
          <li>Sending and receiving collection emails on behalf of the Controller.</li>
          <li>AI-assisted reply classification and draft generation (inference only).</li>
          <li>Reporting on outstanding balances and collection activity.</li>
        </ul>
      </LegalSection>

      <LegalSection title='Types of personal data'>
        <p>
          Contact details, financial account data, email content, and behavioral metadata as
          described in our{' '}
          <Link href='/privacy-policy' className='text-primary hover:underline'>
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title='Categories of data subjects'>
        <p>
          The Controller&apos;s clients (debtors), the Controller&apos;s employees and contractors
          who use RevCollect, and individuals who correspond via collection emails.
        </p>
      </LegalSection>

      <LegalSection title='Processor obligations'>
        <ul className='list-disc space-y-2 pl-5'>
          <li>Process personal data only on documented instructions from the Controller.</li>
          <li>Ensure persons authorized to process data are bound by confidentiality.</li>
          <li>Implement appropriate technical and organizational measures (see Security page).</li>
          <li>Assist the Controller with data subject requests within 30 days.</li>
          <li>Notify the Controller of a personal data breach within 72 hours.</li>
          <li>Delete or return all personal data after termination, subject to legal retention.</li>
          <li>Make available information necessary to demonstrate compliance.</li>
        </ul>
      </LegalSection>

      <LegalSection title='Sub-processors'>
        <p>
          Controller authorizes Processor to engage sub-processors listed at{' '}
          <Link href='/sub-processors' className='text-primary hover:underline'>
            /sub-processors
          </Link>
          . Processor will notify Controller of material changes. Controller may object on
          reasonable grounds relating to data protection.
        </p>
      </LegalSection>

      <LegalSection title='International transfers'>
        <p>
          Where personal data is transferred outside the EEA or UK, Processor relies on Standard
          Contractual Clauses or equivalent mechanisms provided by sub-processors.
        </p>
      </LegalSection>

      <LegalSection title='AI processing'>
        <p>
          Processor uses commercial AI APIs (Anthropic, OpenAI) for inference only. Customer data is
          not used to train or fine-tune models. This processing is disclosed in the sub-processor
          list.
        </p>
      </LegalSection>

      <LegalSection title='Execution'>
        <p>
          By using RevCollect, Controller agrees to this DPA. For a countersigned copy, email{' '}
          <a href='mailto:legal@revcollect.app' className='text-primary hover:underline'>
            legal@revcollect.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
