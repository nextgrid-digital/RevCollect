'use client';

import { useEffect, useLayoutEffect, type RefObject } from 'react';

/** Survives list remounts when navigating between /inbox/[messageId] routes. */
let persistedScrollTop = 0;

export function saveInboxListScrollTop(scrollTop: number) {
  persistedScrollTop = scrollTop;
}

export function readInboxListScrollTop() {
  return persistedScrollTop;
}

export function useInboxListScrollPreserve(
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
