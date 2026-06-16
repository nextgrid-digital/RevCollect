'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface MobileWorkspaceBarProps {
  backHref: string;
  backLabel: string;
  title?: string;
  trailing?: ReactNode;
  className?: string;
}

export function MobileWorkspaceBar({
  backHref,
  backLabel,
  title,
  trailing,
  className
}: MobileWorkspaceBarProps) {
  return (
    <div
      className={cn(
        'border-border/60 flex shrink-0 items-center gap-2 border-b px-3 py-2 md:hidden',
        className
      )}
    >
      <SidebarTrigger className='-ml-1 shrink-0' />
      <Link href={backHref} className='text-primary shrink-0 text-sm font-medium hover:underline'>
        ← {backLabel}
      </Link>
      {title ? (
        <p className='text-foreground min-w-0 flex-1 truncate text-center text-xs font-semibold'>
          {title}
        </p>
      ) : (
        <div className='min-w-0 flex-1' />
      )}
      {trailing ? <div className='shrink-0'>{trailing}</div> : null}
    </div>
  );
}
