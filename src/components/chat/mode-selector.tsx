'use client';

import { memo, useCallback, useState, type ComponentType } from 'react';
import { Icons } from '@/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type ModeOption = {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  description?: string;
};

export type ModeSelectorProps = {
  modes: ModeOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (modeId: string) => void;
  className?: string;
};

export const ModeSelector = memo(function ModeSelector({
  modes,
  value,
  defaultValue,
  onChange,
  className
}: ModeSelectorProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeId = isControlled ? value : internalValue;
  const activeMode = modes.find((m) => m.id === activeId) ?? modes[0];
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (id: string) => {
      if (!isControlled) setInternalValue(id);
      onChange?.(id);
      setOpen(false);
    },
    [isControlled, onChange]
  );

  if (modes.length === 0) return null;

  const ActiveIcon = activeMode?.icon;
  const hasMultiple = modes.length > 1;

  const trigger = (
    <button
      type='button'
      className={cn(
        'inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
        className
      )}
    >
      {ActiveIcon ? <ActiveIcon className='size-3.5 shrink-0' /> : null}
      <span className='truncate'>{activeMode?.label}</span>
      {hasMultiple ? <Icons.chevronDown className='size-3.5 shrink-0 opacity-60' /> : null}
    </button>
  );

  if (!hasMultiple) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align='start' side='top' sideOffset={6} className='w-44 p-1'>
        {modes.map((mode) => {
          const isActive = mode.id === activeMode?.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              type='button'
              onClick={() => handleSelect(mode.id)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs leading-4 text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800',
                isActive && 'bg-neutral-100 dark:bg-neutral-800'
              )}
            >
              {Icon ? (
                mode.description ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className='inline-flex shrink-0'
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <Icon className='size-3.5' />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side='left' sideOffset={8} className='max-w-[220px]'>
                      {mode.description}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Icon className='size-3.5 shrink-0' />
                )
              ) : null}
              <span className='min-w-0 flex-1 truncate font-medium'>{mode.label}</span>
              {isActive ? <Icons.check className='size-3.5 shrink-0' /> : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
});
