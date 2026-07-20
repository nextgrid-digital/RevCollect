'use client';

import { Button } from '@/components/ui/button';
import { getRevCollectService, MOCK_TENANT_ID } from '../../api';
import { useExportTenantData, useRequestTenantDeletion } from '../../api/queries';
import { SettingsSection } from './settings-section';

export function SettingsPrivacySection() {
  const exportMutation = useExportTenantData();
  const deletionMutation = useRequestTenantDeletion();
  const tenantId = getRevCollectService().getTenantId() ?? MOCK_TENANT_ID;

  return (
    <SettingsSection
      title='Privacy and data'
      description='Export your workspace data or request deletion.'
      className='pt-6'
    >
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={exportMutation.isPending}
          onClick={() => exportMutation.mutate(tenantId)}
        >
          {exportMutation.isPending ? 'Preparing export…' : 'Export workspace data'}
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={deletionMutation.isPending}
          onClick={() => deletionMutation.mutate(tenantId)}
        >
          Request data deletion
        </Button>
      </div>
    </SettingsSection>
  );
}
