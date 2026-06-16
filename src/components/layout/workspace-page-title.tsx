import type { ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface WorkspacePageTitleProps {
  title: string;
  className?: string;
  actions?: ReactNode;
}

export function WorkspacePageTitle({ title, className, actions }: WorkspacePageTitleProps) {
  return (
    <div className={cn('flex shrink-0 items-center justify-between gap-2', className)}>
      <div className='flex min-w-0 items-center gap-2'>
        <SidebarTrigger className='-ml-1 shrink-0' />
        <h1 className='text-foreground truncate text-sm font-semibold'>{title}</h1>
      </div>
      {actions ? <div className='shrink-0'>{actions}</div> : null}
    </div>
  );
}
