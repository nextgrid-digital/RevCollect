import type { Metadata } from 'next';
import { AuditWorkspace } from '@/features/audit/components/audit-workspace';
import { AUDIT_META } from '@/features/audit/lib/ui-copy';

export const metadata: Metadata = {
  title: AUDIT_META.title,
  description: AUDIT_META.description,
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
