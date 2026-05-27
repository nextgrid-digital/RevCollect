import React from 'react';
import { Heading } from '../ui/heading';
import type { InfobarContent } from '@/components/ui/infobar';
import { cn } from '@/lib/utils';

function PageSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4 p-4 md:px-6'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='bg-muted mb-2 h-8 w-48 rounded' />
          <div className='bg-muted h-4 w-96 rounded' />
        </div>
      </div>
      <div className='bg-muted mt-6 h-40 w-full rounded-lg' />
      <div className='bg-muted h-40 w-full rounded-lg' />
    </div>
  );
}

export default function PageContainer({
  children,
  isLoading = false,
  access = true,
  accessFallback,
  pageTitle,
  pageDescription,
  infoContent,
  pageHeaderAction,
  compactMobile = false,
  lockPageScroll = false
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  access?: boolean;
  accessFallback?: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  infoContent?: InfobarContent;
  pageHeaderAction?: React.ReactNode;
  compactMobile?: boolean;
  lockPageScroll?: boolean;
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

  const hasHeader = pageTitle || pageHeaderAction;

  const pageClasses = compactMobile
    ? 'flex flex-1 flex-col px-3 pt-1 pb-3 md:px-6 md:pt-4'
    : 'flex flex-1 flex-col px-4 pt-2 pb-4 md:px-6 md:pt-4';

  return (
    <div className={lockPageScroll ? cn(pageClasses, 'min-h-0 overflow-hidden') : pageClasses}>
      {hasHeader && (
        <div className='mb-3 flex shrink-0 flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between'>
          <Heading
            title={pageTitle ?? ''}
            description={compactMobile ? '' : (pageDescription ?? '')}
            infoContent={infoContent}
          />
          {pageHeaderAction && <div className='shrink-0'>{pageHeaderAction}</div>}
        </div>
      )}
      <div className={lockPageScroll ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : undefined}>
        {content}
      </div>
    </div>
  );
}
