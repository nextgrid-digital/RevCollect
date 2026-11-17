'use client';

import { Button } from '@/components/ui/button';
import { useAppUser } from '@/lib/supabase/app-user-context';
import { getRevCollectService, MOCK_TENANT_ID } from '../../api';
import { useExportTenantData, useRequestTenantDeletion } from '../../api/queries';
import { SettingsSection } from './settings-section';

export function SettingsPrivacySection() {
  const exportMutation = useExportTenantData();
  const deletionMutation = useRequestTenantDeletion();
  const user = useAppUser();
  const tenantId = getRevCollectService().getTenantId() ?? MOCK_TENANT_ID;
  const accountLabel = user.email || user.name;

  return (
    <SettingsSection
      title='Privacy and data'
      description='Email admin@revcollect.ai to delete the stored books, payments, and sent collection mail for this workspace. We complete the request within 30 days. The subscription record stays.'
    >
      {accountLabel ? (
        <p className='text-sm'>
          Request for <span className='font-medium'>{accountLabel}</span>
        </p>
      ) : null}
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          isLoading={exportMutation.isPending}
          disabled={deletionMutation.isPending}
          onClick={() => exportMutation.mutate(tenantId)}
        >
          Export workspace data
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          isLoading={deletionMutation.isPending}
          disabled={exportMutation.isPending}
          onClick={() => {
            const confirmed = window.confirm(
              'Email admin@revcollect.ai and ask us to delete the stored books, payments, and sent mail for this workspace?'
            );
            if (!confirmed) return;
            deletionMutation.mutate(tenantId);
          }}
        >
          Request data deletion
        </Button>
      </div>
    </SettingsSection>
  );
}
