import type { Metadata } from 'next';
import { LegalPage } from '@/features/revcollect/legal/legal-page';

export const metadata: Metadata = {
  title: 'Sub-processors — RevCollect',
  description: 'Vendors that process RevCollect data.'
};

export default function SubProcessorsPage() {
  return (
    <LegalPage title='Sub-processors'>
      <ul className='list-disc space-y-2 pl-5'>
        <li>Supabase — authentication, Postgres, and encrypted secrets storage.</li>
        <li>Vercel — application hosting and scheduled ingest.</li>
        <li>Google — Gmail send and read when you connect Gmail.</li>
        <li>Xero, Intuit, or Zoho — accounting APIs for the ledger you connect.</li>
        <li>
          Vercel AI Gateway (and the model providers it routes to) — inference for drafts only, not
          training on your books.
        </li>
      </ul>
    </LegalPage>
  );
}
