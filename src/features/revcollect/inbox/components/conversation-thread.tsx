'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ThreadEmail } from '../../types';
import { InboxContextSectionLabel } from './inbox-context-section-label';
import { EmailMessageCard } from './email-message-card';
import { EmailTurnDivider } from './email-turn-divider';

interface ConversationThreadProps {
  emails: ThreadEmail[];
  highlightedEmailId?: string | null;
  customerName: string;
  customerCompany: string;
  customerAvatarUrl?: string;
  latestCustomerEmailId?: string;
  replyIntentLabel?: string;
}

export function ConversationThread({
  emails,
  highlightedEmailId,
  customerName,
  customerCompany,
  customerAvatarUrl,
  latestCustomerEmailId,
  replyIntentLabel
}: ConversationThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' });
    });
    return () => cancelAnimationFrame(frame);
  }, [emails]);

  return (
    <div className='flex flex-col gap-3'>
      <InboxContextSectionLabel>Conversation</InboxContextSectionLabel>
      <div className='flex flex-col gap-3'>
        {emails.map((email, index) => {
          const isCustomer = email.author === 'customer';
          const senderName = isCustomer ? customerName : 'You';
          const senderCompany = isCustomer ? customerCompany : undefined;
          const showIntent = isCustomer && email.id === latestCustomerEmailId && !!replyIntentLabel;

          return (
            <div
              key={email.id}
              data-thread-email-id={email.id}
              className={cn(
                'scroll-mt-24 rounded-xl transition-shadow',
                highlightedEmailId === email.id && 'ring-primary/60 shadow-sm ring-2'
              )}
            >
              {index > 0 ? <EmailTurnDivider sentAt={email.sentAt} /> : null}
              <EmailMessageCard
                email={email}
                senderName={senderName}
                senderCompany={senderCompany}
                customerAvatarUrl={customerAvatarUrl}
                intentLabel={showIntent ? replyIntentLabel : undefined}
              />
            </div>
          );
        })}
        <div ref={endRef} className='shrink-0 scroll-mt-2' aria-hidden />
      </div>
    </div>
  );
}
