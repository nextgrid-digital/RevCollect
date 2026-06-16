'use client';

import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { cn } from '@/lib/utils';
import { WorkspaceFilterPillsRow } from '@/features/revcollect/components/workspace-filter-pills-row';
import type { InboxListFilter } from '../lib/filter-inbox-messages';
import type { InboxMessageListVariant } from './inbox-message-list';

interface InboxMessageListTitleProps {
  variant?: InboxMessageListVariant;
  className?: string;
}

export function InboxMessageListTitle({ className }: InboxMessageListTitleProps) {
  return <WorkspacePageTitle title='Inbox' className={className} />;
}

interface InboxMessageListHeaderProps {
  variant?: InboxMessageListVariant;
  showTitle?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filter: InboxListFilter;
  onFilterChange: (filter: InboxListFilter) => void;
  allCount: number;
  needsAttentionCount: number;
  overdueCount: number;
  draftsCount: number;
  upToDateCount: number;
  disputesCount: number;
}

export function InboxMessageListHeader({
  variant = 'workspace',
  showTitle = true,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  allCount,
  needsAttentionCount,
  overdueCount,
  draftsCount,
  upToDateCount,
  disputesCount
}: InboxMessageListHeaderProps) {
  const filterPills = [
    { id: 'all', label: 'All', count: allCount },
    { id: 'needs_attention', label: 'Needs attention', count: needsAttentionCount },
    { id: 'overdue', label: 'Overdue', count: overdueCount },
    { id: 'drafts', label: 'AI drafts', count: draftsCount },
    { id: 'up_to_date', label: 'Up to date', count: upToDateCount },
    { id: 'escalated', label: 'Disputes', count: disputesCount }
  ] as const;

  const pillTone = variant === 'workspace' ? 'sidebar' : 'default';

  return (
    <div
      className={cn(
        'min-w-0 shrink-0 border-b',
        variant === 'workspace' ? 'border-sidebar-border' : 'border-border/60'
      )}
    >
      {showTitle ? (
        <div className='px-4 py-4'>
          <InboxMessageListTitle />
        </div>
      ) : null}

      {variant === 'notion' ? (
        <div className='px-4 pb-4'>
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

      <WorkspaceFilterPillsRow
        pills={[...filterPills]}
        activeId={filter}
        onChange={onFilterChange}
        layoutId='inbox-filter-pill'
        tone={pillTone}
        showTopPadding={!showTitle}
      />

      {variant === 'workspace' ? (
        <div className='px-4 pb-4'>
          <div className='relative'>
            <Icons.search className='text-sidebar-foreground/50 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            <Input
              type='search'
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder='Search threads...'
              aria-label='Search threads'
              className='bg-sidebar-accent/50 text-sidebar-foreground placeholder:text-sidebar-foreground/50 h-9 border-0 pl-9 text-sm shadow-none'
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
