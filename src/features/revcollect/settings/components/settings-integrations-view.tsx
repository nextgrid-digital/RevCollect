'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIntegrationStatus } from '../../api/queries';
import { SettingsSection } from './settings-section';

const integrations = [
  {
    key: 'gmail' as const,
    href: '/onboarding/connect-gmail',
    icon: Icons.inbox
  },
  {
    key: 'xero' as const,
    href: '/onboarding/connect-xero',
    icon: Icons.billing
  },
  {
    key: 'stripe' as const,
    href: '/settings/billing',
    icon: Icons.billing
  }
];

export function SettingsIntegrationsView() {
  const { data: integrationStatus, isPending } = useIntegrationStatus();

  if (isPending || !integrationStatus) {
    return <p className='text-muted-foreground text-sm'>Loading integrations…</p>;
  }

  return (
    <div className='divide-border divide-y'>
      {integrations.map(({ key, href, icon: Icon }, index) => {
        const item = integrationStatus[key];
        return (
          <SettingsSection
            key={key}
            title={item.label}
            leading={<Icon className='size-4' />}
            action={
              <Badge variant={item.connected ? 'default' : 'secondary'}>
                {item.connected ? 'Connected' : 'Not connected'}
              </Badge>
            }
            className={index === 0 ? 'pb-6' : index === integrations.length - 1 ? 'pt-6' : 'py-6'}
          >
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-muted-foreground text-sm'>{item.detail}</p>
              {!item.connected ? (
                <Button asChild size='sm' variant='outline'>
                  <Link href={href}>Connect</Link>
                </Button>
              ) : null}
            </div>
          </SettingsSection>
        );
      })}
    </div>
  );
}
