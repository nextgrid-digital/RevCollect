'use client';

import { useMemo, useState } from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { collectionStatusOptions } from '../../components/status-pill';
import type { CollectionStatus } from '../../types';

interface CustomersStatusFilterProps {
  selectedStatuses: CollectionStatus[];
  onSelectedStatusesChange: (statuses: CollectionStatus[]) => void;
}

export function CustomersStatusFilter({
  selectedStatuses,
  onSelectedStatusesChange
}: CustomersStatusFilterProps) {
  const [open, setOpen] = useState(false);
  const selectedValues = useMemo(() => new Set(selectedStatuses), [selectedStatuses]);

  const toggleStatus = (status: CollectionStatus) => {
    const next = new Set(selectedValues);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    onSelectedStatusesChange(Array.from(next));
  };

  const clearStatuses = () => {
    onSelectedStatusesChange([]);
  };

  const hasSelection = selectedValues.size > 0;

  return (
    <div className='inline-flex items-center'>
      {hasSelection ? (
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='border-input h-9 w-8 shrink-0 rounded-r-none border border-r-0 border-dashed'
          aria-label='Clear status filter'
          onClick={clearStatuses}
        >
          <Icons.xCircle />
        </Button>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className={cn('h-9 border-dashed', hasSelection && 'rounded-l-none')}
          >
            {!hasSelection ? <Icons.plusCircle /> : null}
            Status
            {hasSelection ? (
              <>
                <Separator
                  orientation='vertical'
                  className='mx-0.5 data-[orientation=vertical]:h-4'
                />
                <Badge variant='secondary' className='rounded-sm px-1 font-normal lg:hidden'>
                  {selectedValues.size}
                </Badge>
                <div className='hidden items-center gap-1 lg:flex'>
                  {selectedValues.size > 2 ? (
                    <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
                      {selectedValues.size} selected
                    </Badge>
                  ) : (
                    collectionStatusOptions
                      .filter((option) => selectedValues.has(option.value))
                      .map((option) => (
                        <Badge
                          variant='secondary'
                          key={option.value}
                          className='rounded-sm px-1 font-normal'
                        >
                          {option.label}
                        </Badge>
                      ))
                  )}
                </div>
              </>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[12.5rem] p-0' align='start'>
          <Command>
            <CommandList className='max-h-full'>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup className='max-h-[18.75rem] overflow-x-hidden overflow-y-auto'>
                {collectionStatusOptions.map((option) => {
                  const isSelected = selectedValues.has(option.value);

                  return (
                    <CommandItem key={option.value} onSelect={() => toggleStatus(option.value)}>
                      <div
                        className={cn(
                          'border-primary flex size-4 items-center justify-center rounded-sm border',
                          isSelected ? 'bg-primary' : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <CheckIcon />
                      </div>
                      <span className='truncate'>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {hasSelection ? (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem onSelect={clearStatuses} className='justify-center text-center'>
                      Clear filters
                    </CommandItem>
                  </CommandGroup>
                </>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
