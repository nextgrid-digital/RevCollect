import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { workspaceCanvasPadding } from '@/features/revcollect/lib/workspace-layout';

interface WorkspaceCanvasProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function WorkspaceCanvas({ children, className, padded = true }: WorkspaceCanvasProps) {
  return (
    <div
      className={cn(
        'bg-background flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 overflow-hidden',
        padded && workspaceCanvasPadding,
        padded && 'gap-x-4',
        className
      )}
    >
      {children}
    </div>
  );
}
