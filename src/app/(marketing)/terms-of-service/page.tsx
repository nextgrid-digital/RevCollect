import type { Metadata } from 'next';
import { LegalPageShell, LegalSection } from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Terms of Service',
  robots: {
    index: false
  }
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      title='Terms of Service'
      lastUpdated={new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })}
    >
      <LegalSection title='Introduction'>
        <p>
          Welcome to our application. These Terms of Service govern your access to and use of our
          platform. By accessing or using this application, you agree to be bound by these terms.
          Please read them carefully before proceeding to use our services.
        </p>
      </LegalSection>

      <LegalSection title='Demo purpose'>
        <p>
          This application is provided solely for demonstration and educational purposes. It is not
          intended for production use, and we make no guarantees regarding its suitability for any
          specific purpose. All data and functionality are provided as-is for showcasing features
          and capabilities only.
        </p>
      </LegalSection>

      <LegalSection title='Open source'>
        <p>
          This is an open-source project. The source code is available for review, modification, and
          distribution under the applicable open-source license. We encourage community contributions
          and feedback to help improve the project. Please refer to the project repository for
          licensing details and contribution guidelines.
        </p>
      </LegalSection>

      <LegalSection title='No warranty'>
        <p>
          This application is provided &ldquo;as is&rdquo; without any warranties of any kind, either
          express or implied. We expressly disclaim all warranties, including but not limited to
          implied warranties of merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the application will be uninterrupted, timely,
          secure, or error-free.
        </p>
      </LegalSection>

      <LegalSection title='Data usage'>
        <p>
          Any data you provide while using this demo application may be stored temporarily for the
          purpose of demonstrating functionality. We do not guarantee the security or privacy of
          any data entered into this demo application. Please do not enter sensitive, personal, or
          confidential information. Data may be deleted or reset at any time without notice.
        </p>
      </LegalSection>

      <LegalSection title='Changes to these terms'>
        <p>
          We reserve the right to modify or replace these Terms of Service at any time at our sole
          discretion. It is your responsibility to review these terms periodically for changes.
          Your continued use of the application following the posting of any changes constitutes
          acceptance of those changes.
        </p>
      </LegalSection>

      <p className='text-muted-foreground text-center text-sm'>
        If you have any questions about these Terms of Service, please refer to the project
        documentation or repository for more information.
      </p>
    </LegalPageShell>
  );
}
