'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgentAddonStatus, useSubscribeAgentAddon } from '../../api/queries';
import { formatCurrencyWhole } from '../../utils';
import { MetricBlock } from '../../components/metric-block';
import { SettingsSection } from './settings-section';

const billingStats = [
  { title: 'Plan', value: 'Growth', description: 'Billed monthly' },
  { title: 'Seats', value: '3', description: '2 active users' },
  { title: 'AI drafts', value: '248', description: 'This billing period' }
] as const;

export function SettingsBillingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightAgent = searchParams.get('addon') === 'agent';
  const addonCardRef = useRef<HTMLDivElement>(null);
  const { data: addonStatus } = useAgentAddonStatus();
  const subscribeAddon = useSubscribeAgentAddon();

  useEffect(() => {
    if (!highlightAgent || !addonCardRef.current) return;
    addonCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightAgent]);

  return (
    <div className='divide-border divide-y'>
      <div className='grid gap-6 pb-6 sm:grid-cols-3'>
        {billingStats.map((stat) => (
          <MetricBlock
            key={stat.title}
            label={stat.title}
            value={stat.value}
            description={<p className='text-muted-foreground text-xs'>{stat.description}</p>}
          />
        ))}
      </div>

      <SettingsSection title='Add-ons' className='pt-6'>
        <div
          ref={addonCardRef}
          className={
            highlightAgent
              ? 'ring-primary/30 rounded-lg ring-2 ring-offset-2 ring-offset-background'
              : undefined
          }
        >
          <div className='flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 space-y-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='text-sm font-semibold'>Collections Agent</h3>
                {addonStatus?.subscribed ? <Badge variant='secondary'>Subscribed</Badge> : null}
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                AI-drafted follow-ups, daily digest, and promise tracking for your AR workflow.
              </p>
              <p className='text-muted-foreground text-xs'>
                {addonStatus
                  ? `${formatCurrencyWhole(addonStatus.priceMonthlyCents)}/month · AI cost ~${formatCurrencyWhole(addonStatus.estimatedAiCostMonthlyCents)}/mo`
                  : '$39/month'}
              </p>
            </div>
            <div className='flex shrink-0 flex-wrap gap-2'>
              {addonStatus?.subscribed ? (
                <Button type='button' variant='outline' onClick={() => router.push('/agent')}>
                  Configure agent
                </Button>
              ) : (
                <Button
                  type='button'
                  onClick={() => subscribeAddon.mutate()}
                  disabled={subscribeAddon.isPending}
                >
                  Subscribe
                </Button>
              )}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title='Payment method' className='pt-6'>
        <p className='text-muted-foreground text-sm'>
          Stripe is connected. Billing management will be available when Supabase auth is wired up.
        </p>
      </SettingsSection>
    </div>
  );
}
