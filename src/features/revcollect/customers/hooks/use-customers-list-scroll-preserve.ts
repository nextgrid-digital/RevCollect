'use client';

import { useEffect, useLayoutEffect, type RefObject } from 'react';

/** Survives list remounts when navigating between /customers/[id] routes. */
let persistedScrollTop = 0;

export function saveCustomersListScrollTop(scrollTop: number) {
  persistedScrollTop = scrollTop;
}

export function readCustomersListScrollTop() {
  return persistedScrollTop;
}

export function useCustomersListScrollPreserve(
  scrollRef: RefObject<HTMLDivElement | null>,
  selectedId: string | null
) {
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      persistedScrollTop = el.scrollTop;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = persistedScrollTop;
  }, [scrollRef, selectedId]);
}
