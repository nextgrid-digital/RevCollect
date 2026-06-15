'use client';

import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { InboxListFilter } from '../lib/filter-inbox-messages';

interface InboxMessageListHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: InboxListFilter;
  onFilterChange: (filter: InboxListFilter) => void;
  allCount: number;
  overdueCount: number;
  dueSoonCount: number;
  escalatedCount: number;
}

export function InboxMessageListHeader({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  allCount,
  overdueCount,
  dueSoonCount,
  escalatedCount
}: InboxMessageListHeaderProps) {
  const filterPills: Array<{ id: InboxListFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: allCount },
    { id: 'overdue', label: 'Overdue', count: overdueCount },
    { id: 'due_soon', label: 'Due Soon', count: dueSoonCount },
    { id: 'escalated', label: 'Escalated', count: escalatedCount }
  ];

  return (
    <div className='space-y-4 px-4 pt-4 pb-3'>
      <div className='relative'>
        <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
        <Input
          type='search'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder='Search emails...'
          className='h-9 border-0 bg-muted/50 pl-9 text-sm shadow-none'
        />
      </div>

      <div className='flex gap-1.5 overflow-x-auto pb-0.5 whitespace-nowrap'>
        {filterPills.map((pill) => {
          const isActive = filter === pill.id;
          return (
            <button
              key={pill.id}
              type='button'
              onClick={() => onFilterChange(pill.id)}
              className={cn(
                'inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <span>{pill.label}</span>
              <span className='text-muted-foreground tabular-nums'>{pill.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
