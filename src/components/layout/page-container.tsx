import React from 'react';
import { cn } from '@/lib/utils';

function PageSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-40 w-full rounded-lg' />
      <div className='bg-muted h-40 w-full rounded-lg' />
    </div>
  );
}

export default function PageContainer({
  children,
  isLoading = false,
  access = true,
  accessFallback,
  compactMobile = false,
  lockPageScroll = false,
  flushTop = false,
  flushX = false
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  access?: boolean;
  accessFallback?: React.ReactNode;
  compactMobile?: boolean;
  lockPageScroll?: boolean;
  flushTop?: boolean;
  flushX?: boolean;
}) {
  if (!access) {
    return (
      <div className='flex flex-1 items-center justify-center p-4 md:px-6'>
        {accessFallback ?? (
          <div className='text-muted-foreground text-center text-lg'>
            You do not have access to this page.
          </div>
        )}
      </div>
    );
  }

  const content = isLoading ? <PageSkeleton /> : children;

  const pageClasses = flushX
    ? cn('flex flex-1 flex-col p-0', flushTop ? 'pt-0' : undefined)
    : compactMobile
      ? cn('flex flex-1 flex-col px-3 pb-3 md:px-6', flushTop ? 'pt-0 md:pt-0' : 'pt-1 md:pt-4')
      : cn('flex flex-1 flex-col px-4 pb-4 md:px-6', flushTop ? 'pt-0 md:pt-0' : 'pt-2 md:pt-4');

  return (
    <div
      className={cn(
        pageClasses,
        'min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-hidden'
      )}
    >
      <div
        className={
          lockPageScroll
            ? 'flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-hidden'
            : 'min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto'
        }
      >
        {content}
      </div>
    </div>
  );
}
