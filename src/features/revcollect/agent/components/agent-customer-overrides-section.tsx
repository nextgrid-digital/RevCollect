'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { AgentCustomerOverride, AgentFollowUpStyle, Customer } from '../../types';
import { CustomerAvatar } from '../../components/customer-avatar';
import { FOLLOW_UP_STYLE_OPTIONS } from '../lib/follow-up-style';
import { SettingsSection } from '../../settings/components/settings-section';

interface AgentCustomerOverridesSectionProps {
  overrides: AgentCustomerOverride[];
  customersById: Map<string, Customer>;
  availableCustomers: Customer[];
  onOverrideChange: (customerId: string, style: AgentFollowUpStyle) => void;
  onNoteChange: (customerId: string, note: string) => void;
  onAddOverride: (customerId: string) => void;
  onRemoveOverride: (customerId: string) => void;
}

export function AgentCustomerOverridesSection({
  overrides,
  customersById,
  availableCustomers,
  onOverrideChange,
  onNoteChange,
  onAddOverride,
  onRemoveOverride
}: AgentCustomerOverridesSectionProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const handleAdd = () => {
    if (!selectedCustomerId) return;
    onAddOverride(selectedCustomerId);
    setSelectedCustomerId('');
  };

  return (
    <SettingsSection
      title='Different tone for specific customers'
      description='Most customers get the default tone. Add anyone who should always get a softer or firmer reminder (for example a key account vs a chronic late payer).'
    >
      <ul className='divide-border divide-y rounded-lg border'>
        {overrides.map((override) => {
          const customer = customersById.get(override.customerId);
          if (!customer) return null;

          return (
            <li key={override.customerId} className='flex flex-col gap-3 px-3 py-3'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='flex min-w-0 items-center gap-3'>
                  <CustomerAvatar
                    name={customer.company}
                    avatarUrl={customer.avatarUrl}
                    className='size-9 shrink-0'
                  />
                  <p className='truncate text-sm font-medium'>{customer.company}</p>
                </div>
                <div className='flex w-full shrink-0 items-center gap-2 sm:w-auto'>
                  <Select
                    value={override.style}
                    onValueChange={(value) =>
                      onOverrideChange(override.customerId, value as AgentFollowUpStyle)
                    }
                  >
                    <SelectTrigger
                      className='w-full sm:w-36'
                      aria-label={`Tone for ${customer.company}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOLLOW_UP_STYLE_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8 shrink-0'
                    onClick={() => onRemoveOverride(override.customerId)}
                    aria-label={`Remove tone override for ${customer.company}`}
                  >
                    <Icons.trash className='size-4' />
                  </Button>
                </div>
              </div>
              <Input
                value={override.note}
                onChange={(e) => onNoteChange(override.customerId, e.target.value)}
                placeholder='Note (optional)'
                className='text-sm'
                aria-label={`Note for ${customer.company}`}
              />
            </li>
          );
        })}
      </ul>

      {availableCustomers.length > 0 ? (
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger className='w-full sm:flex-1' aria-label='Customer to add'>
              <SelectValue placeholder='Add a customer…' />
            </SelectTrigger>
            <SelectContent>
              {availableCustomers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type='button'
            variant='outline'
            className='shrink-0'
            disabled={!selectedCustomerId}
            onClick={handleAdd}
          >
            Add customer
          </Button>
        </div>
      ) : (
        <p className='text-muted-foreground text-xs'>All customers have a custom tone set.</p>
      )}
    </SettingsSection>
  );
}
