'use client';

import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { InboxListFilter } from '../lib/filter-inbox-messages';
import type { InboxMessageListVariant } from './inbox-message-list';

interface InboxMessageListHeaderProps {
  variant?: InboxMessageListVariant;
  search: string;
  onSearchChange: (value: string) => void;
  filter: InboxListFilter;
  onFilterChange: (filter: InboxListFilter) => void;
  allCount: number;
  overdueCount: number;
  draftsCount: number;
  repliedCount: number;
  disputesCount: number;
}

export function InboxMessageListHeader({
  variant = 'workspace',
  search,
  onSearchChange,
  filter,
  onFilterChange,
  allCount,
  overdueCount,
  draftsCount,
  repliedCount,
  disputesCount
}: InboxMessageListHeaderProps) {
  const filterPills: Array<{ id: InboxListFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: allCount },
    { id: 'overdue', label: 'Overdue', count: overdueCount },
    { id: 'drafts', label: 'AI drafts', count: draftsCount },
    { id: 'replied', label: 'Replied', count: repliedCount },
    { id: 'escalated', label: 'Disputes', count: disputesCount }
  ];

  return (
    <div
      className={cn(
        'shrink-0 border-b',
        variant === 'workspace' ? 'border-sidebar-border' : 'border-border/60'
      )}
    >
      <div className='flex items-center gap-2 px-4 py-3'>
        <SidebarTrigger className='-ml-1 shrink-0' />
        <h1 className='text-sm font-semibold'>Inbox</h1>
      </div>

      {variant === 'notion' ? (
        <div className='px-4 pb-3'>
          <div className='relative'>
            <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            <Input
              type='search'
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder='Search threads...'
              aria-label='Search threads'
              className='h-9 border-0 bg-muted/50 pl-9 text-sm shadow-none'
            />
          </div>
        </div>
      ) : null}

      <div className='flex gap-1.5 overflow-x-auto px-4 pb-3 whitespace-nowrap'>
        {filterPills.map((pill) => {
          const isActive = filter === pill.id;
          return (
            <button
              key={pill.id}
              type='button'
              aria-pressed={isActive}
              onClick={() => onFilterChange(pill.id)}
              className={cn(
                'inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors',
                variant === 'workspace'
                  ? isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  : isActive
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

      {variant === 'workspace' ? (
        <div className='px-4 pb-3'>
          <div className='relative'>
            <Icons.search
              className={cn(
                'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2',
                variant === 'workspace' ? 'text-sidebar-foreground/50' : 'text-muted-foreground'
              )}
            />
            <Input
              type='search'
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder='Search threads...'
              aria-label='Search threads'
              className={cn(
                'h-9 border-0 pl-9 text-sm shadow-none',
                variant === 'workspace'
                  ? 'bg-sidebar-accent/50 text-sidebar-foreground placeholder:text-sidebar-foreground/50'
                  : 'bg-muted/50'
              )}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
