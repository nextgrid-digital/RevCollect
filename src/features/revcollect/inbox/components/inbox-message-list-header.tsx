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
      <div className='flex gap-1.5 overflow-x-auto pb-1 whitespace-nowrap'>
        {filterPills.map((pill) => {
          const isActive = filter === pill.id;
          return (
            <button
              key={pill.id}
              type='button'
              onClick={() => onFilterChange(pill.id)}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors',
                isActive
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              <span>{pill.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px]',
                  isActive ? 'bg-black/10 dark:bg-white/15' : 'bg-muted'
                )}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
