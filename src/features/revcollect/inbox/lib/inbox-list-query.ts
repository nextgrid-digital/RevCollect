import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { InboxListFilter } from './filter-inbox-messages';

const VALID_FILTERS: InboxListFilter[] = [
  'all',
  'needs_attention',
  'overdue',
  'drafts',
  'up_to_date',
  'escalated'
];

export function parseInboxFilter(value: string | null): InboxListFilter | null {
  if (!value) return null;
  if (value === 'replied') return 'up_to_date';
  return VALID_FILTERS.includes(value as InboxListFilter) ? (value as InboxListFilter) : null;
}

export function parseInboxSearch(value: string | null): string {
  return value?.trim() ?? '';
}

export interface InboxListQuery {
  filter?: InboxListFilter;
  search?: string;
}

function applyInboxListQuery(params: URLSearchParams, query: InboxListQuery): URLSearchParams {
  const next = new URLSearchParams(params.toString());

  if (query.filter !== undefined) {
    if (query.filter === 'all') {
      next.delete('filter');
    } else {
      next.set('filter', query.filter);
    }
  }

  if (query.search !== undefined) {
    const trimmed = query.search.trim();
    if (trimmed) {
      next.set('q', trimmed);
    } else {
      next.delete('q');
    }
  }

  return next;
}

export function mergeInboxListQuery(
  existingSearchParams: URLSearchParams | ReadonlyURLSearchParams,
  query: InboxListQuery
): URLSearchParams {
  return applyInboxListQuery(new URLSearchParams(existingSearchParams.toString()), query);
}

export function readInboxListQuery(
  searchParams: URLSearchParams | ReadonlyURLSearchParams
): Required<InboxListQuery> {
  return {
    filter: parseInboxFilter(searchParams.get('filter')) ?? 'all',
    search: parseInboxSearch(searchParams.get('q'))
  };
}

export function buildInboxPath({
  messageId,
  filter,
  search,
  existingSearchParams
}: {
  messageId?: string | null;
  filter?: InboxListFilter;
  search?: string;
  existingSearchParams?: URLSearchParams | ReadonlyURLSearchParams;
}): string {
  const base = messageId ? `/inbox/${messageId}` : '/inbox';
  const params = applyInboxListQuery(new URLSearchParams(existingSearchParams?.toString() ?? ''), {
    ...(filter !== undefined ? { filter } : {}),
    ...(search !== undefined ? { search } : {})
  });
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function getInboxMessageIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/inbox\/([^/]+)$/);
  return match?.[1] ?? null;
}

export function buildInboxPathForPathname(
  pathname: string,
  existingSearchParams: URLSearchParams | ReadonlyURLSearchParams,
  query: InboxListQuery = {}
): string {
  const messageId = getInboxMessageIdFromPath(pathname);
  return buildInboxPath({
    messageId,
    existingSearchParams,
    ...query
  });
}

export function preserveInboxListQueryPath(
  messageId: string | null | undefined,
  existingSearchParams: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildInboxPath({ messageId, existingSearchParams });
}
