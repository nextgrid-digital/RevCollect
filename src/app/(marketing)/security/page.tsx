import { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageShell, LegalSection } from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Security Practices | RevCollect',
  robots: { index: true }
};

export default function SecurityPage() {
  return (
    <LegalPageShell title='Security Practices' lastUpdated='June 2026'>
      <LegalSection title='Overview'>
        <p>
          RevCollect is built for bookkeepers and finance teams who trust us with sensitive client
          data. This page describes the controls we implement today and our roadmap. We do not hold
          SOC 2 certification yet; we target SOC 2 Type I in months 12–18.
        </p>
      </LegalSection>

      <LegalSection title='Encryption'>
        <ul className='list-disc space-y-2 pl-5'>
          <li>All traffic uses TLS 1.2 or higher.</li>
          <li>Database storage is encrypted at rest (Supabase).</li>
          <li>Email bodies are encrypted at the application layer before storage (AES-256-GCM).</li>
        </ul>
      </LegalSection>

      <LegalSection title='Tenant isolation'>
        <p>
          Every database row is scoped to a workspace{' '}
          <code className='text-foreground'>tenant_id</code>. Row Level Security in PostgreSQL
          enforces isolation even if application code has a bug. Authentication is handled by Clerk
          Organizations; database credentials never reach the browser.
        </p>
      </LegalSection>

      <LegalSection title='AI and your data'>
        <p>
          We use Anthropic and OpenAI commercial APIs for inference only. Customer data is sent as
          prompt context for a single request and is not used to train or fine-tune models. We do
          not log full email bodies to analytics or error-tracking systems.
        </p>
      </LegalSection>

      <LegalSection title='Access logging'>
        <p>
          Access to personal data (viewing email threads, exports, deletions) is recorded in an
          append-only audit log with actor, timestamp, and resource identifier.
        </p>
      </LegalSection>

      <LegalSection title='Data retention and deletion'>
        <p>
          Cancelled workspaces are purged within 30 days. Email content older than 24 months is
          automatically purged unless you opt out. See our{' '}
          <Link href='/privacy-policy' className='text-primary hover:underline'>
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
      </LegalSection>

      <LegalSection title='Incident response'>
        <p>
          We commit to notifying affected customers and supervisory authorities within 72 hours of
          becoming aware of a personal data breach, where required by GDPR, CCPA, or Australian
          privacy law.
        </p>
      </LegalSection>

      <LegalSection title='Penetration testing'>
        <p>We schedule third-party penetration testing starting in month 6 after launch.</p>
      </LegalSection>

      <LegalSection title='Contact'>
        <p>
          Security inquiries:{' '}
          <a href='mailto:security@revcollect.app' className='text-primary hover:underline'>
            security@revcollect.app
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
