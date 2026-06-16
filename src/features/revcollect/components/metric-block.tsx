'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MotionReveal } from '@/features/revcollect/motion/motion-primitives';

interface MetricBlockProps {
  label: string;
  value: string;
  description?: ReactNode;
  className?: string;
}

export function MetricBlock({ label, value, description, className }: MetricBlockProps) {
  return (
    <MotionReveal>
      <div className={cn('min-w-0', className)}>
        <p className='text-muted-foreground text-[10px] font-semibold tracking-wide uppercase sm:text-[11px]'>
          {label}
        </p>
        <p className='mt-1.5 text-xl font-semibold tracking-tight tabular-nums sm:mt-2 sm:text-2xl'>
          {value}
        </p>
        {description ? <div className='mt-1'>{description}</div> : null}
      </div>
    </MotionReveal>
  );
}
