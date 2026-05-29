'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeSelector } from '../themes/theme-selector';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';

export default function Header() {
  const pathname = usePathname();
  const isInbox = pathname === '/inbox' || pathname.startsWith('/inbox/');

  const searchAndTheme = (
    <>
      <div className='hidden md:flex'>
        <SearchInput />
      </div>
      <ThemeModeToggle />
      <div className='hidden sm:block'>
        <ThemeSelector />
      </div>
    </>
  );

  return (
    <header className='bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 backdrop-blur-md md:h-14'>
      <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <div className='min-w-0 max-w-[60vw] truncate md:max-w-none'>
          <Breadcrumbs />
        </div>
        {isInbox ? searchAndTheme : null}
      </div>

      {!isInbox ? (
        <div className='flex shrink-0 items-center gap-2 px-4'>{searchAndTheme}</div>
      ) : null}
    </header>
  );
}
