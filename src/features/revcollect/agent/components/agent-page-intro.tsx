'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '../../components/page-header';
import { formatCurrencyWhole } from '../../utils';

interface AgentPageIntroProps {
  isActive: boolean;
  priceMonthlyCents: number;
  onActiveChange: (isActive: boolean) => void;
}

export function AgentPageIntro({
  isActive,
  priceMonthlyCents,
  onActiveChange
}: AgentPageIntroProps) {
  return (
    <PageHeader
      title='Collections Agent'
      description='Overnight, RevCollect drafts collection emails for overdue invoices. You review and send from Inbox—nothing goes out without your approval.'
      actions={
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Switch
              id='agent-enabled'
              checked={isActive}
              onCheckedChange={onActiveChange}
              aria-label='Agent enabled'
            />
            <Label htmlFor='agent-enabled' className='text-sm font-medium'>
              Agent enabled
            </Label>
          </div>
          <span className='bg-secondary text-secondary-foreground inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-normal'>
            Add-on · {formatCurrencyWhole(priceMonthlyCents)}/mo
          </span>
        </div>
      }
    />
  );
}
