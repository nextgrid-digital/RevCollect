'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { AgentBehaviors, Customer } from '../../types';
import { SettingsSection } from '../../settings/components/settings-section';
import { RelationshipBadge } from '../../components/relationship-badge';
import { relationshipBadgeLabel } from '../../lib/relationship-policy';

interface AgentRelationshipSafetySectionProps {
  behaviors: AgentBehaviors;
  customers: Customer[];
  onChange: (behaviors: AgentBehaviors) => void;
}

export function AgentRelationshipSafetySection({
  behaviors,
  customers,
  onChange
}: AgentRelationshipSafetySectionProps) {
  const blocked = customers.filter((customer) => relationshipBadgeLabel(customer));

  return (
    <SettingsSection
      title='Relationship safety'
      description='Overnight drafts skip paused, disputed, and do-not-contact customers. Pause is never applied automatically.'
    >
      <div className='space-y-4'>
        <div className='flex items-center justify-between gap-4 rounded-lg border px-3 py-3'>
          <div className='min-w-0'>
            <Label htmlFor='default-pause-days' className='text-sm font-medium'>
              Default pause length
            </Label>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              Used when you confirm a suggested pause.
            </p>
          </div>
          <Select
            value={String(behaviors.defaultPauseDays ?? 14)}
            onValueChange={(value) => onChange({ ...behaviors, defaultPauseDays: Number(value) })}
          >
            <SelectTrigger id='default-pause-days' className='w-28'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>7 days</SelectItem>
              <SelectItem value='14'>14 days</SelectItem>
              <SelectItem value='30'>30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ul className='divide-border divide-y rounded-lg border'>
          <li className='flex items-start justify-between gap-4 px-3 py-3'>
            <div className='min-w-0'>
              <Label htmlFor='overnight-manual-only' className='text-sm font-medium'>
                Overnight drafts for manual-only
              </Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                Off by default. Composer still works for you.
              </p>
            </div>
            <Switch
              id='overnight-manual-only'
              checked={behaviors.overnightDraftManualOnly}
              onCheckedChange={(checked) =>
                onChange({ ...behaviors, overnightDraftManualOnly: checked })
              }
            />
          </li>
          <li className='flex items-start justify-between gap-4 px-3 py-3'>
            <div className='min-w-0'>
              <Label htmlFor='allow-late-fees' className='text-sm font-medium'>
                Allow late-fee language
              </Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                Blocked in drafts unless you turn this on.
              </p>
            </div>
            <Switch
              id='allow-late-fees'
              checked={behaviors.allowLateFeeMentions}
              onCheckedChange={(checked) =>
                onChange({ ...behaviors, allowLateFeeMentions: checked })
              }
            />
          </li>
          <li className='flex items-start justify-between gap-4 px-3 py-3'>
            <div className='min-w-0'>
              <Label htmlFor='allow-legal' className='text-sm font-medium'>
                Allow legal language
              </Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                Blocks “final warning”, “legal action”, “penalty”, and “you are avoiding”.
              </p>
            </div>
            <Switch
              id='allow-legal'
              checked={behaviors.allowLegalLanguage}
              onCheckedChange={(checked) => onChange({ ...behaviors, allowLegalLanguage: checked })}
            />
          </li>
        </ul>

        {blocked.length > 0 ? (
          <div className='space-y-2'>
            <p className='text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase'>
              Currently blocked
            </p>
            <ul className='divide-border divide-y rounded-lg border'>
              {blocked.map((customer) => (
                <li key={customer.id} className='flex items-center justify-between gap-3 px-3 py-2'>
                  <span className='truncate text-sm'>{customer.company}</span>
                  <RelationshipBadge customer={customer} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </SettingsSection>
  );
}
