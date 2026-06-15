import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
        className
      )}
    >
      <div className='min-w-0'>
        <h1 className='text-xl font-semibold tracking-tight sm:text-2xl'>{title}</h1>
        {description ? <p className='text-muted-foreground mt-1 text-sm'>{description}</p> : null}
      </div>
      {actions ? <div className='w-full shrink-0 sm:w-auto'>{actions}</div> : null}
    </div>
  );
}
