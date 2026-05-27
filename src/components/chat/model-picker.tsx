'use client';

import { memo, useCallback, useState } from 'react';
import { Icons } from '@/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type ModelOption = {
  id: string;
  name: string;
  version?: string;
};

export type ModelPickerProps = {
  models: ModelOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (modelId: string) => void;
  placeholder?: string;
  className?: string;
};

export const ModelPicker = memo(function ModelPicker({
  models,
  value,
  defaultValue,
  onChange,
  placeholder = 'Auto',
  className
}: ModelPickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeId = isControlled ? value : internalValue;
  const activeModel = models.find((m) => m.id === activeId) ?? models[0];
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (id: string) => {
      if (!isControlled) setInternalValue(id);
      onChange?.(id);
      setOpen(false);
    },
    [isControlled, onChange]
  );

  if (models.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={cn(
            'inline-flex h-8 max-w-[9rem] items-center gap-1 rounded-full px-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
            className
          )}
        >
          <span className='truncate'>{activeModel?.name ?? placeholder}</span>
          <Icons.chevronDown className='size-3.5 shrink-0 opacity-60' />
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' side='top' sideOffset={6} className='w-52 p-1'>
        {models.map((model) => {
          const isActive = model.id === activeModel?.id;
          return (
            <button
              key={model.id}
              type='button'
              onClick={() => handleSelect(model.id)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs leading-4 text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800',
                isActive && 'bg-neutral-100 dark:bg-neutral-800'
              )}
            >
              <span className='min-w-0 flex-1 truncate font-medium'>{model.name}</span>
              {model.version ? (
                <span className='text-[10px] text-neutral-500 dark:text-neutral-400'>
                  {model.version}
                </span>
              ) : null}
              {isActive ? <Icons.check className='size-3.5 shrink-0' /> : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
});
