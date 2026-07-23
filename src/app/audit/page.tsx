import type { Metadata } from 'next';
import { AuditWorkspace } from '@/features/audit/components/audit-workspace';

export const metadata: Metadata = {
  title: 'AR Audit',
  description: 'RevCollect internal AR audit — payment behavior report from invoice history',
  robots: {
    index: false,
    follow: false
  }
};

export default function AuditPage() {
  return (
    <main className='audit-shell min-h-svh'>
      <AuditWorkspace />
    </main>
  );
}
