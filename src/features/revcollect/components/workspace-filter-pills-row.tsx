'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { MotionPressable } from '@/features/revcollect/motion/motion-primitives';

export interface WorkspaceFilterPill {
  id: string;
  label: string;
  count: number;
}

export type WorkspaceFilterPillsTone = 'sidebar' | 'default';

interface WorkspaceFilterPillsRowProps<T extends string> {
  pills: WorkspaceFilterPill[];
  activeId: T;
  onChange: (id: T) => void;
  layoutId: string;
  tone?: WorkspaceFilterPillsTone;
  showTopPadding?: boolean;
  className?: string;
}

export function WorkspaceFilterPillsRow<T extends string>({
  pills,
  activeId,
  onChange,
  layoutId,
  tone = 'sidebar',
  showTopPadding = false,
  className
}: WorkspaceFilterPillsRowProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const pillCountsKey = pills.map((pill) => pill.count).join(',');
  const fadeFrom = tone === 'sidebar' ? 'from-sidebar/95' : 'from-background';

  const updateFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 1;
    const atStart = el.scrollLeft <= 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setShowLeftFade(hasOverflow && !atStart);
    setShowRightFade(hasOverflow && !atEnd);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateFade();
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(updateFade);
    });

    const observer = new ResizeObserver(updateFade);
    observer.observe(el);
    el.addEventListener('scroll', updateFade, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      el.removeEventListener('scroll', updateFade);
    };
  }, [updateFade, pillCountsKey]);

  return (
    <div
      className={cn(
        'relative min-w-0 max-w-full overflow-hidden',
        showTopPadding && 'pt-3',
        className
      )}
    >
      <div
        ref={scrollRef}
        className='flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-4 whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
      >
        {pills.map((pill) => {
          const isActive = activeId === pill.id;
          return (
            <MotionPressable
              key={pill.id}
              aria-pressed={isActive}
              onClick={() => onChange(pill.id as T)}
              className={cn(
                'relative inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors',
                tone === 'sidebar'
                  ? isActive
                    ? 'text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  : isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId={layoutId}
                  className={cn(
                    'absolute inset-0 rounded-md',
                    tone === 'sidebar' ? 'bg-sidebar-accent' : 'bg-muted'
                  )}
                  transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                />
              ) : null}
              <span className='relative z-[1]'>{pill.label}</span>
              <span className='text-muted-foreground relative z-[1] tabular-nums'>
                {pill.count}
              </span>
            </MotionPressable>
          );
        })}
      </div>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-0 left-0 bottom-4 z-10 w-12 bg-gradient-to-r to-transparent transition-opacity duration-200',
          fadeFrom,
          showLeftFade ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-0 right-0 bottom-4 z-10 w-12 bg-gradient-to-l to-transparent transition-opacity duration-200',
          fadeFrom,
          showRightFade ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}
