'use client';

import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InboxListFilter } from '../lib/filter-inbox-messages';

interface InboxMessageListHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: InboxListFilter;
  onFilterChange: (filter: InboxListFilter) => void;
  unreadCount: number;
  readCount: number;
}

export function InboxMessageListHeader({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  unreadCount,
  readCount
}: InboxMessageListHeaderProps) {
  return (
    <div className='space-y-3'>
      <div className='relative'>
        <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
        <Input
          type='search'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder='Search emails...'
          className='h-9 pl-9 text-sm'
        />
      </div>
      <Tabs
        value={filter}
        onValueChange={(value) => onFilterChange(value as InboxListFilter)}
        className='gap-0'
      >
        <TabsList className='grid h-9 w-full grid-cols-2'>
          <TabsTrigger value='unread' className='text-xs'>
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value='read' className='text-xs'>
            Read ({readCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
