'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useInboxOpenMode, type InboxOpenMode } from './inbox-open-mode-context';

const MODES: Array<{
  id: InboxOpenMode;
  label: string;
  icon: keyof typeof Icons;
}> = [
  { id: 'side', label: 'Side peek', icon: 'panelLeft' },
  { id: 'center', label: 'Center peek', icon: 'product' },
  { id: 'full', label: 'Full page', icon: 'externalLink' }
];

interface InboxOpenModeSwitcherProps {
  className?: string;
  size?: 'sm' | 'default';
}

export function InboxOpenModeSwitcher({ className, size = 'sm' }: InboxOpenModeSwitcherProps) {
  const { mode, setMode } = useInboxOpenMode();
  const buttonSize = size === 'sm' ? 'size-8' : 'size-9';

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {MODES.map((item) => {
        const Icon = Icons[item.icon];
        const isActive = mode === item.id;

        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant={isActive ? 'secondary' : 'ghost'}
                size='icon'
                className={cn(buttonSize, isActive && 'bg-muted')}
                aria-pressed={isActive}
                onClick={() => setMode(item.id)}
              >
                <Icon className='size-4' />
                <span className='sr-only'>{item.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
