'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { WorkspaceGeneralSettings } from '../../types';
import {
  WORKSPACE_INDUSTRY_OPTIONS,
  WORKSPACE_TIMEZONE_OPTIONS
} from '../lib/workspace-settings-options';
import { SettingsCard } from './settings-card';

interface SettingsCompanySectionProps {
  settings: WorkspaceGeneralSettings;
  onChange: (patch: Partial<WorkspaceGeneralSettings>) => void;
  primaryContactEmailError?: string;
}

export function SettingsCompanySection({
  settings,
  onChange,
  primaryContactEmailError
}: SettingsCompanySectionProps) {
  return (
    <SettingsCard title='Company'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='company-name'>Company name</Label>
          <Input
            id='company-name'
            value={settings.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='industry'>Industry</Label>
          <Select
            value={settings.industry}
            onValueChange={(value) => onChange({ industry: value })}
          >
            <SelectTrigger id='industry' className='w-full'>
              <SelectValue placeholder='Select industry' />
            </SelectTrigger>
            <SelectContent>
              {WORKSPACE_INDUSTRY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='primary-contact-email'>Primary contact email</Label>
          <Input
            id='primary-contact-email'
            type='email'
            value={settings.primaryContactEmail}
            onChange={(e) => onChange({ primaryContactEmail: e.target.value })}
            aria-invalid={Boolean(primaryContactEmailError)}
          />
          {primaryContactEmailError ? (
            <p className='text-destructive text-sm'>{primaryContactEmailError}</p>
          ) : null}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='timezone'>Timezone</Label>
          <Select
            value={settings.timezone}
            onValueChange={(value) => onChange({ timezone: value })}
          >
            <SelectTrigger id='timezone' className='w-full'>
              <SelectValue placeholder='Select timezone' />
            </SelectTrigger>
            <SelectContent>
              {WORKSPACE_TIMEZONE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </SettingsCard>
  );
}
