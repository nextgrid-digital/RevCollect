'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  getInboxOpenModeIcon,
  INBOX_OPEN_MODES,
  type InboxOpenMode
} from '../lib/inbox-open-mode-config';
import { useInboxOpenMode } from './inbox-open-mode-context';

interface InboxOpenModeMenuProps {
  className?: string;
}

export function InboxOpenModeMenu({ className }: InboxOpenModeMenuProps) {
  const { mode, setMode } = useInboxOpenMode();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn('size-8 shrink-0', className)}
          aria-label='Inbox layout options'
        >
          <Icons.ellipsis className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-52'>
        <DropdownMenuLabel>Inbox layout</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => setMode(value as InboxOpenMode)}
        >
          {INBOX_OPEN_MODES.map((item) => {
            const Icon = getInboxOpenModeIcon(item.icon);
            return (
              <DropdownMenuRadioItem key={item.id} value={item.id} className='gap-2'>
                <Icon className='text-muted-foreground size-4' />
                {item.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
