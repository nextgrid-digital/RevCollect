import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { InboxHeaderActions } from '@/features/revcollect/inbox/components/inbox-header-actions';

export default function Header() {
  return (
    <header className='bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 px-4 backdrop-blur-md md:h-14'>
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <div className='min-w-0 max-w-[60vw] truncate md:max-w-none'>
          <Breadcrumbs />
        </div>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <InboxHeaderActions />
      </div>
    </header>
  );
}
