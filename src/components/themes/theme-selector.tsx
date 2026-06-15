'use client';

import { useThemeConfig } from '@/components/themes/active-theme';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { Icons } from '../icons';
import { Kbd } from '@/components/ui/kbd';
import { THEMES } from './theme.config';

interface ThemeSelectorProps {
  id?: string;
  showShortcut?: boolean;
  variant?: 'header' | 'settings';
  className?: string;
}

export function ThemeSelector({
  id = 'theme-selector',
  showShortcut = true,
  variant = 'header',
  className
}: ThemeSelectorProps) {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const isSettings = variant === 'settings';

  return (
    <div
      className={cn(
        isSettings ? 'flex items-center justify-between gap-4' : 'flex items-center gap-2',
        className
      )}
    >
      <Label htmlFor={id} className={isSettings ? 'shrink-0' : 'sr-only'}>
        Theme
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger
          id={id}
          className={cn(isSettings ? 'w-[12rem]' : 'justify-start *:data-[slot=select-value]:w-24')}
        >
          {!isSettings ? (
            <>
              <span className='text-muted-foreground hidden sm:block'>
                <Icons.palette />
              </span>
              <span className='text-muted-foreground block sm:hidden'>Theme</span>
            </>
          ) : null}
          <SelectValue placeholder='Select a theme' />
          {showShortcut && !isSettings ? <Kbd>T T</Kbd> : null}
        </SelectTrigger>
        <SelectContent align={isSettings ? 'start' : 'end'}>
          {THEMES.length > 0 && (
            <SelectGroup>
              <SelectLabel>themes</SelectLabel>
              {THEMES.map((theme) => (
                <SelectItem key={theme.name} value={theme.value}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
