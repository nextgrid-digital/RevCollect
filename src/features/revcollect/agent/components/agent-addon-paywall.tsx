'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { useSubscribeAgentAddon } from '../../api/queries';
import { formatCurrencyWhole } from '../../utils';
import { AgentJobStory } from './agent-job-story';

const INCLUDED = [
  'Overnight reminder drafts for overdue invoices',
  'You review and send from Inbox — nothing goes out on its own',
  'Morning summary of what needs you'
] as const;

interface AgentAddonPaywallProps {
  priceMonthlyCents: number;
  estimatedAiCostMonthlyCents: number;
}

export function AgentAddonPaywall({
  priceMonthlyCents,
  estimatedAiCostMonthlyCents
}: AgentAddonPaywallProps) {
  const subscribeAddon = useSubscribeAgentAddon();

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 pb-6'>
      <WorkspaceCard className='p-4 md:p-5'>
        <div className='space-y-4'>
          <div>
            <p className='text-base font-semibold'>
              Add-on · {formatCurrencyWhole(priceMonthlyCents)}/month
            </p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Typical AI usage ~{formatCurrencyWhole(estimatedAiCostMonthlyCents)}/mo
            </p>
          </div>

          <div>
            <p className='text-sm font-medium'>What you get</p>
            <ul className='text-muted-foreground mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed'>
              {INCLUDED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              size='sm'
              isLoading={subscribeAddon.isPending}
              onClick={() => subscribeAddon.mutate()}
            >
              Subscribe
            </Button>
            <Button asChild size='sm' variant='outline'>
              <Link href='/settings/billing?addon=agent'>Manage in Billing</Link>
            </Button>
          </div>
        </div>
      </WorkspaceCard>

      <WorkspaceCard className='p-4 md:p-5'>
        <AgentJobStory />
      </WorkspaceCard>
    </div>
  );
}
