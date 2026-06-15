'use client';

import Link from 'next/link';
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
      description='Export your workspace data or request deletion. UK and EU customers can download our Data Processing Agreement.'
      className='pt-6'
    >
      <div className='space-y-4'>
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
        <ul className='text-muted-foreground space-y-2 text-sm'>
          <li>
            <Link href='/legal/dpa' className='text-primary hover:underline'>
              Data Processing Agreement (DPA)
            </Link>
          </li>
          <li>
            <Link href='/sub-processors' className='text-primary hover:underline'>
              Sub-processor list
            </Link>
          </li>
          <li>
            <Link href='/privacy-policy' className='text-primary hover:underline'>
              Privacy policy
            </Link>
          </li>
          <li>
            <Link href='/security' className='text-primary hover:underline'>
              Security practices
            </Link>
          </li>
        </ul>
      </div>
    </SettingsSection>
  );
}
