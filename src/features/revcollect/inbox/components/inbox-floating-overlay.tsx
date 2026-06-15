'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InboxFloatingOverlayProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  onHeightChange?: (height: number) => void;
}

export function InboxFloatingOverlay({
  children,
  className,
  contentClassName,
  onHeightChange
}: InboxFloatingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onHeightChangeRef = useRef(onHeightChange);
  const lastReportedHeightRef = useRef(0);

  useEffect(() => {
    onHeightChangeRef.current = onHeightChange;
  }, [onHeightChange]);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const report = () => {
      const height = el.offsetHeight;
      if (height === lastReportedHeightRef.current) return;
      lastReportedHeightRef.current = height;
      onHeightChangeRef.current?.(height);
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={overlayRef}
      className={cn(
        'pointer-events-none absolute right-0 bottom-0 left-0 z-30 border-border/60 border-t bg-background pt-2',
        className
      )}
    >
      <div className={cn('pointer-events-auto px-4 pb-3', contentClassName)}>{children}</div>
    </div>
  );
}
