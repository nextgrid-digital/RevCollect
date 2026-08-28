'use client';

import dynamic from 'next/dynamic';
import { Icons } from '@/components/icons';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { useCustomers, useInvoices } from '@/features/revcollect/api/queries';
import { useAppUser } from '@/lib/supabase/app-user-context';

const DashboardView = dynamic(() => import('./dashboard-view').then((mod) => mod.DashboardView), {
  ssr: false
});

export function DashboardClient() {
  const { name } = useAppUser();
  const customersQuery = useCustomers();
  const invoicesQuery = useInvoices();
  const hasArData = (customersQuery.data?.length ?? 0) > 0 || (invoicesQuery.data?.length ?? 0) > 0;

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle
        title='Dashboard'
        className='h-8 shrink-0'
        actions={
          hasArData ? (
            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400'>
              <Icons.check className='size-3.5' />
              Synced recently
            </span>
          ) : null
        }
      />
      <DashboardView userName={name} />
    </WorkspaceCanvas>
  );
}
