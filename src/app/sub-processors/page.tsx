import { Metadata } from 'next';
import { LegalPageShell, LegalSection } from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Sub-processors | RevCollect',
  robots: { index: true }
};

const subprocessors = [
  {
    name: 'Vercel',
    purpose: 'Application hosting and CDN',
    location: 'United States',
    website: 'https://vercel.com/legal/privacy-policy'
  },
  {
    name: 'Supabase',
    purpose: 'Database hosting (PostgreSQL)',
    location: 'United States / EU (region-dependent)',
    website: 'https://supabase.com/privacy'
  },
  {
    name: 'Clerk',
    purpose: 'Authentication and organization management',
    location: 'United States',
    website: 'https://clerk.com/legal/privacy'
  },
  {
    name: 'Anthropic',
    purpose: 'AI inference (draft generation, classification)',
    location: 'United States',
    website: 'https://www.anthropic.com/legal/privacy'
  },
  {
    name: 'OpenAI',
    purpose: 'AI inference (draft generation, classification)',
    location: 'United States',
    website: 'https://openai.com/policies/privacy-policy'
  },
  {
    name: 'Resend',
    purpose: 'Transactional email delivery',
    location: 'United States',
    website: 'https://resend.com/legal/privacy-policy'
  },
  {
    name: 'Postmark',
    purpose: 'Transactional email delivery (alternate provider)',
    location: 'United States',
    website: 'https://postmarkapp.com/privacy-policy'
  },
  {
    name: 'Stripe',
    purpose: 'Payment processing and billing',
    location: 'United States',
    website: 'https://stripe.com/privacy'
  },
  {
    name: 'Sentry',
    purpose: 'Error monitoring (PII scrubbed)',
    location: 'United States',
    website: 'https://sentry.io/privacy/'
  }
];

export default function SubProcessorsPage() {
  return (
    <LegalPageShell title='Sub-processors' lastUpdated='June 2026'>
      <LegalSection title='Overview'>
        <p>
          RevCollect uses the following third-party service providers (&quot;sub-processors&quot;)
          to process personal data on behalf of our customers. We maintain DPAs with providers where
          required. We will update this page before engaging new sub-processors that handle personal
          data.
        </p>
      </LegalSection>

      <LegalSection title='Current sub-processors'>
        <div className='space-y-4'>
          {subprocessors.map((sp) => (
            <div key={sp.name} className='border-border rounded-lg border p-4'>
              <p className='text-foreground font-medium'>{sp.name}</p>
              <p className='mt-1'>{sp.purpose}</p>
              <p className='text-sm'>Primary location: {sp.location}</p>
              <a
                href={sp.website}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary mt-2 inline-block text-sm hover:underline'
              >
                Privacy policy
              </a>
            </div>
          ))}
        </div>
      </LegalSection>
    </LegalPageShell>
  );
}
