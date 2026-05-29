'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ThreadEmail } from '../../types';
import { EmailMessageCard } from './email-message-card';
import { EmailTurnDivider } from './email-turn-divider';

interface ConversationThreadProps {
  emails: ThreadEmail[];
  highlightedEmailId?: string | null;
}

export function ConversationThread({ emails, highlightedEmailId }: ConversationThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' });
    });
    return () => cancelAnimationFrame(frame);
  }, [emails]);

  return (
    <div className='flex flex-col gap-4'>
      {emails.map((email, index) => (
        <div
          key={email.id}
          data-thread-email-id={email.id}
          className={cn(
            'flex scroll-mt-24 flex-col gap-4 rounded-xl transition-shadow',
            highlightedEmailId === email.id && 'ring-primary/60 shadow-sm ring-2'
          )}
        >
          {index > 0 ? <EmailTurnDivider sentAt={email.sentAt} /> : null}
          <EmailMessageCard email={email} />
        </div>
      ))}
      <div
        ref={endRef}
        className='shrink-0 scroll-mt-2'
        style={{ height: 'var(--inbox-composer-height, 11rem)' }}
        aria-hidden
      />
    </div>
  );
}
