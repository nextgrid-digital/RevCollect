'use client';

import { useTheme } from 'next-themes';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const COLOR_MODES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
] as const;

interface ThemeModeSettingProps {
  id?: string;
  className?: string;
  variant?: 'stacked' | 'settings';
}

export function ThemeModeSetting({
  id = 'color-mode-setting',
  className,
  variant = 'stacked'
}: ThemeModeSettingProps) {
  const { theme, setTheme } = useTheme();
  const isSettings = variant === 'settings';

  return (
    <div
      className={cn(isSettings ? 'flex items-center justify-between gap-4' : undefined, className)}
    >
      <Label htmlFor={id} className={isSettings ? 'shrink-0' : undefined}>
        Color mode
      </Label>
      <Select value={theme ?? 'system'} onValueChange={setTheme}>
        <SelectTrigger id={id} className={cn(isSettings ? 'w-[12rem]' : 'mt-2 w-full')}>
          <SelectValue placeholder='Select color mode' />
        </SelectTrigger>
        <SelectContent>
          {COLOR_MODES.map((mode) => (
            <SelectItem key={mode.value} value={mode.value}>
              {mode.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
