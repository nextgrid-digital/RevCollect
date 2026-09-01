import type { ReactNode } from 'react';
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { WorkspaceConnectionStatus } from './workspace-connection-status';

export interface WorkspaceBreadcrumbSegment {
  label: string;
  href?: string;
}

interface WorkspacePageTitleProps {
  title?: string;
  breadcrumbs?: WorkspaceBreadcrumbSegment[];
  className?: string;
  actions?: ReactNode;
  stackActionsBelow?: boolean;
}

export function WorkspacePageTitle({
  title,
  breadcrumbs,
  className,
  actions,
  stackActionsBelow = false
}: WorkspacePageTitleProps) {
  return (
    <div className={cn('flex shrink-0 flex-col gap-2', className, stackActionsBelow && 'h-auto')}>
      <div className='flex min-h-8 items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <SidebarTrigger className='-ml-1 shrink-0' />
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav aria-label='Breadcrumb' className='flex min-w-0 items-center gap-1.5 text-sm'>
              {breadcrumbs.map((segment, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <span
                    key={`${segment.label}-${index}`}
                    className='flex min-w-0 items-center gap-1.5'
                  >
                    {index > 0 ? (
                      <span className='text-muted-foreground shrink-0' aria-hidden>
                        /
                      </span>
                    ) : null}
                    {segment.href && !isLast ? (
                      <Link
                        href={segment.href}
                        className='text-primary shrink-0 font-medium hover:underline'
                      >
                        {segment.label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          'truncate font-semibold',
                          isLast ? 'text-foreground' : 'text-foreground'
                        )}
                      >
                        {segment.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          ) : (
            <h1 className='text-foreground truncate text-sm font-semibold'>{title}</h1>
          )}
        </div>
        <div className='ml-auto flex shrink-0 items-center gap-2 pr-2'>
          {stackActionsBelow ? null : actions}
          <WorkspaceConnectionStatus />
        </div>
      </div>
      {stackActionsBelow && actions ? <div className='w-full'>{actions}</div> : null}
    </div>
  );
}
