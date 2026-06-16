'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { AgentFollowUpStyle } from '../../types';
import { FOLLOW_UP_STYLE_OPTIONS } from '../lib/follow-up-style';
import { SettingsSection } from '../../settings/components/settings-section';

interface AgentFollowUpStyleSectionProps {
  value: AgentFollowUpStyle;
  onChange: (style: AgentFollowUpStyle) => void;
}

export function AgentFollowUpStyleSection({ value, onChange }: AgentFollowUpStyleSectionProps) {
  return (
    <SettingsSection
      title='Default email tone'
      description='Used for new AI drafts unless a customer has a custom tone below.'
    >
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(next as AgentFollowUpStyle)}
        className='grid gap-2 sm:grid-cols-3'
      >
        {FOLLOW_UP_STYLE_OPTIONS.map((option) => {
          const inputId = `agent-style-${option.id}`;
          return (
            <Label
              key={option.id}
              htmlFor={inputId}
              className={cn(
                'hover:bg-muted/50 flex cursor-pointer flex-col rounded-lg border p-3 transition-colors',
                value === option.id && 'border-primary/40 bg-muted/40'
              )}
            >
              <div className='flex items-start gap-2'>
                <RadioGroupItem id={inputId} value={option.id} className='mt-0.5' />
                <div className='min-w-0 space-y-1'>
                  <span className='text-sm font-medium'>{option.label}</span>
                  <p className='text-muted-foreground text-xs leading-relaxed'>
                    {option.description}
                  </p>
                </div>
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </SettingsSection>
  );
}
