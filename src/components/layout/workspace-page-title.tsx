import type { ReactNode } from 'react';
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

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
      {actions ? (
        <div className={cn(stackActionsBelow ? 'w-full md:w-auto' : 'shrink-0')}>{actions}</div>
      ) : null}
    </div>
  );
}
