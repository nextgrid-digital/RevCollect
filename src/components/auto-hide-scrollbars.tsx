'use client';

import { useEffect } from 'react';

const scrollTimers = new WeakMap<EventTarget, ReturnType<typeof setTimeout>>();
const activeTimers = new Set<ReturnType<typeof setTimeout>>();

const HIDE_DELAY_MS = 900;

function isScrollable(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  const overflowY = style.overflowY;
  const overflowX = style.overflowX;
  const canScrollY =
    (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
    el.scrollHeight > el.clientHeight;
  const canScrollX =
    (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'overlay') &&
    el.scrollWidth > el.clientWidth;

  return canScrollY || canScrollX;
}

function markScrolling(target: HTMLElement) {
  target.dataset.scrolling = 'true';

  const existing = scrollTimers.get(target);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    delete target.dataset.scrolling;
    scrollTimers.delete(target);
    activeTimers.delete(timer);
  }, HIDE_DELAY_MS);

  scrollTimers.set(target, timer);
  activeTimers.add(timer);
}

function findScrollableAncestor(start: EventTarget | null): HTMLElement | null {
  let node = start instanceof HTMLElement ? start : null;

  while (node) {
    if (isScrollable(node)) return node;
    node = node.parentElement;
  }

  return null;
}

export function AutoHideScrollbars() {
  useEffect(() => {
    const onScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!isScrollable(target)) return;
      markScrolling(target);
    };

    const onWheel = (event: WheelEvent) => {
      const scrollable = findScrollableAncestor(event.target);
      if (scrollable) markScrolling(scrollable);
    };

    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.addEventListener('wheel', onWheel, { passive: true, capture: true });

    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('wheel', onWheel, { capture: true });
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return null;
}
