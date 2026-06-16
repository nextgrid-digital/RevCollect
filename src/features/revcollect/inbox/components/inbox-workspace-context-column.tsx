'use client';

import { WorkspaceCard } from '@/components/layout/workspace-card';
import { cn } from '@/lib/utils';
import { workspaceContextWidth } from '@/features/revcollect/lib/workspace-layout';
import { useInboxSelectionData } from '../hooks/use-inbox-selection-data';
import { InboxContextSidebar } from './inbox-context-sidebar';
import { InboxOpenModeMenu } from './inbox-open-mode-menu';

interface InboxWorkspaceContextColumnProps {
  messageId: string;
  onActivityEmailClick?: (emailId: string) => void;
}

export function InboxWorkspaceContextColumn({
  messageId,
  onActivityEmailClick
}: InboxWorkspaceContextColumnProps) {
  const {
    data: selection,
    isLoading,
    isFetching,
    isPlaceholderData
  } = useInboxSelectionData(messageId);
  const selectionMatchesMessage = selection?.message.id === messageId;

  if (!selectionMatchesMessage) {
    if (!isLoading && !isFetching && !isPlaceholderData) {
      return null;
    }

    return (
      <div
        className={cn(
          'hidden min-h-0 min-w-0 shrink-0 flex-col gap-2 self-stretch md:flex',
          workspaceContextWidth
        )}
        aria-hidden
      />
    );
  }

  if (!selection) {
    return (
      <div
        className={cn(
          'hidden min-h-0 min-w-0 shrink-0 flex-col gap-2 self-stretch md:flex',
          workspaceContextWidth
        )}
        aria-hidden
      />
    );
  }

  const { customer, inboxContext, deepAnalysisText, aiInsightText, threadEmails, timelineEvents } =
    selection;
  const mergedInsightText = [aiInsightText, deepAnalysisText].filter(Boolean).join(' ');

  return (
    <div
      className={cn(
        'hidden min-h-0 min-w-0 shrink-0 flex-col gap-2 self-stretch md:flex',
        workspaceContextWidth
      )}
    >
      <div className='flex h-8 shrink-0 items-center justify-end'>
        <InboxOpenModeMenu />
      </div>
      <WorkspaceCard variant='context' className='min-h-0 w-full min-w-0 flex-1'>
        <InboxContextSidebar
          customer={customer}
          inboxContext={inboxContext}
          aiInsightText={mergedInsightText}
          timelineEvents={timelineEvents}
          threadEmails={threadEmails}
          onActivityEmailClick={onActivityEmailClick}
        />
      </WorkspaceCard>
    </div>
  );
}
