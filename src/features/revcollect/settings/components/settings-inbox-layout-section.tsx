'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
  getInboxOpenModeIcon,
  INBOX_OPEN_MODES,
  readInboxOpenMode,
  writeInboxOpenMode,
  DEFAULT_INBOX_OPEN_MODE,
  type InboxOpenMode
} from '@/features/revcollect/inbox/lib/inbox-open-mode-config';
import { SettingsSection } from './settings-section';

export function SettingsInboxLayoutSection() {
  const [mode, setMode] = useState<InboxOpenMode>(DEFAULT_INBOX_OPEN_MODE);

  useEffect(() => {
    setMode(readInboxOpenMode());
  }, []);

  const handleModeChange = (nextMode: InboxOpenMode) => {
    setMode(nextMode);
    writeInboxOpenMode(nextMode);
  };

  return (
    <SettingsSection title='Inbox layout' className='hidden py-6 md:block'>
      <div className='space-y-4'>
        <p className='text-muted-foreground text-sm'>
          Choose how threads open on desktop. Mobile always uses the workspace list and detail flow.
        </p>
        <RadioGroup
          value={mode}
          onValueChange={(value) => handleModeChange(value as InboxOpenMode)}
          className='space-y-2'
        >
          {INBOX_OPEN_MODES.map((item) => {
            const Icon = getInboxOpenModeIcon(item.icon);
            const inputId = `inbox-layout-${item.id}`;

            return (
              <Label
                key={item.id}
                htmlFor={inputId}
                className={cn(
                  'hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  mode === item.id && 'border-primary/40 bg-muted/40'
                )}
              >
                <RadioGroupItem id={inputId} value={item.id} className='mt-0.5' />
                <div className='min-w-0 flex-1 space-y-0.5'>
                  <div className='flex items-center gap-2 text-sm font-medium'>
                    <Icon className='text-muted-foreground size-4 shrink-0' />
                    {item.label}
                  </div>
                  <p className='text-muted-foreground text-sm leading-snug'>{item.description}</p>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </div>
    </SettingsSection>
  );
}
