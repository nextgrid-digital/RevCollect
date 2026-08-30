'use client';

import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { useAppUser } from '@/lib/supabase/app-user-context';
import { DashboardView } from './dashboard-view';

export function DashboardClient() {
  const { name } = useAppUser();

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle title='Dashboard' className='h-8 shrink-0' />
      <DashboardView userName={name} />
    </WorkspaceCanvas>
  );
}
