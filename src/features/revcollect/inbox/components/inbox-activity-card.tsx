import type { ThreadEmail, TimelineEvent } from '../../types';
import { InboxActivityTimeline } from './inbox-activity-timeline';
import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxActivityCardProps {
  events: TimelineEvent[];
  threadEmails: ThreadEmail[];
  onEventClick?: (emailId: string, event?: TimelineEvent) => void;
}

export function InboxActivityCard({ events, threadEmails, onEventClick }: InboxActivityCardProps) {
  return (
    <InboxContextRailSection label='Activity' unstyled contentClassName='px-1 py-1'>
      <InboxActivityTimeline
        events={events}
        threadEmails={threadEmails}
        onEventClick={onEventClick}
      />
    </InboxContextRailSection>
  );
}
