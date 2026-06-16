import type { ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface WorkspacePageTitleProps {
  title: string;
  className?: string;
  actions?: ReactNode;
  stackActionsBelow?: boolean;
}

export function WorkspacePageTitle({
  title,
  className,
  actions,
  stackActionsBelow = false
}: WorkspacePageTitleProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 gap-2',
        stackActionsBelow
          ? 'flex-col items-stretch md:flex-row md:items-center md:justify-between'
          : 'items-center justify-between',
        className
      )}
    >
      <div className='flex min-w-0 items-center gap-2'>
        <SidebarTrigger className='-ml-1 shrink-0' />
        <h1 className='text-foreground truncate text-sm font-semibold'>{title}</h1>
      </div>
      {actions ? (
        <div className={cn(stackActionsBelow ? 'w-full md:w-auto' : 'shrink-0')}>{actions}</div>
      ) : null}
    </div>
  );
}
