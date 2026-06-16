import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  workspaceCard,
  workspaceContextCardSticky,
  workspaceListCard
} from '@/features/revcollect/lib/workspace-layout';

type WorkspaceCardVariant = 'default' | 'list' | 'context';

interface WorkspaceCardProps {
  children: ReactNode;
  className?: string;
  variant?: WorkspaceCardVariant;
}

export function WorkspaceCard({ children, className, variant = 'default' }: WorkspaceCardProps) {
  const shellClass =
    variant === 'list'
      ? workspaceListCard
      : variant === 'context'
        ? cn(workspaceCard, workspaceContextCardSticky, 'flex min-h-0 flex-col')
        : workspaceCard;

  const needsInnerClip = variant === 'list' || variant === 'context';

  return (
    <div className={cn(shellClass, className)}>
      {needsInnerClip ? (
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl'>{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
