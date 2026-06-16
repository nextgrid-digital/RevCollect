'use client';

import { useEffect, useRef } from 'react';
import type { ThreadEmail } from '../../types';
import { InboxContextSectionLabel } from './inbox-context-section-label';
import { EmailMessageCard } from './email-message-card';
import { EmailTurnDivider } from './email-turn-divider';

interface ConversationThreadProps {
  emails: ThreadEmail[];
  customerName: string;
  customerCompany: string;
  customerAvatarUrl?: string;
  latestCustomerEmailId?: string;
  replyIntentLabel?: string;
}

export function ConversationThread({
  emails,
  customerName,
  customerCompany,
  customerAvatarUrl,
  latestCustomerEmailId,
  replyIntentLabel
}: ConversationThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const replyTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (latestCustomerEmailId && replyTargetRef.current) {
        replyTargetRef.current.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        return;
      }
      endRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' });
    });
    return () => cancelAnimationFrame(frame);
  }, [emails, latestCustomerEmailId]);

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
              ref={email.id === latestCustomerEmailId ? replyTargetRef : undefined}
              data-thread-email-id={email.id}
              className='scroll-mt-24'
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
