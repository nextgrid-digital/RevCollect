'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIntegrationStatus } from '../../api/queries';

const integrations = [
  {
    key: 'quickbooks' as const,
    href: '/onboarding/connect-quickbooks',
    icon: Icons.billing
  },
  {
    key: 'gmail' as const,
    href: '/onboarding/connect-gmail',
    icon: Icons.inbox
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
    <div className='grid gap-4'>
      {integrations.map(({ key, href, icon: Icon }) => {
        const item = integrationStatus[key];
        return (
          <Card key={key}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Icon className='size-4' />
                {item.label}
              </CardTitle>
              <Badge variant={item.connected ? 'default' : 'secondary'}>
                {item.connected ? 'Connected' : 'Not connected'}
              </Badge>
            </CardHeader>
            <CardContent className='flex items-center justify-between gap-4'>
              <p className='text-muted-foreground text-sm'>{item.detail}</p>
              {!item.connected ? (
                <Button asChild size='sm' variant='outline'>
                  <Link href={href}>Connect</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
