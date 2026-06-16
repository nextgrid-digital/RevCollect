'use client';

import type { ReactNode } from 'react';
import {
  MotionPanelTransition,
  useRegisterPanelEnter
} from '@/features/revcollect/motion/motion-primitives';

export function useRegisterInboxThreadEnter(callback: () => void) {
  useRegisterPanelEnter(callback);
}

interface InboxThreadTransitionProps {
  messageId: string;
  className?: string;
  children: ReactNode;
}

export function InboxThreadTransition({
  messageId,
  className,
  children
}: InboxThreadTransitionProps) {
  return (
    <MotionPanelTransition
      panelKey={messageId}
      className={className}
      animateMode='enter-only'
      variant='fade'
    >
      {children}
    </MotionPanelTransition>
  );
}

export { useRegisterPanelEnter } from '@/features/revcollect/motion/motion-primitives';
