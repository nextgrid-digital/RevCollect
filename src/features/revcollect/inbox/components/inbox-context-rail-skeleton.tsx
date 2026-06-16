import { Skeleton } from '@/components/ui/skeleton';

export function InboxContextRailSkeleton() {
  return (
    <div className='flex h-full min-h-0 w-full flex-col'>
      <div className='border-border/60 shrink-0 border-b px-3 py-3'>
        <div className='bg-card space-y-2 rounded-2xl px-3 py-2 shadow-sm ring-1 ring-border/60'>
          <div className='flex items-center gap-3'>
            <Skeleton className='size-10 shrink-0 rounded-full' />
            <div className='min-w-0 flex-1 space-y-1.5'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-3 w-1/2' />
            </div>
          </div>
          <Skeleton className='h-8 w-full rounded-full' />
        </div>
      </div>
      <div className='flex min-h-0 flex-1 flex-col gap-3 px-3 pt-2 pb-4'>
        <Skeleton className='h-24 w-full rounded-[16px]' />
        <Skeleton className='h-32 w-full rounded-[16px]' />
        <Skeleton className='h-20 w-full rounded-[16px]' />
        <Skeleton className='h-40 w-full rounded-[16px]' />
      </div>
    </div>
  );
}
