'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { appendCanSpamFooter } from '../../compliance/can-spam';
import type { AgentDraftMeta } from '../../types';
import { useOptionalInboxThreadAttachment } from './inbox-thread-attachment-context';

interface InboxAgentDraftPanelProps {
  draftMeta: AgentDraftMeta;
  className?: string;
}

export function InboxAgentDraftPanel({ draftMeta, className }: InboxAgentDraftPanelProps) {
  const attachment = useOptionalInboxThreadAttachment();
  const attachedInvoiceNumbers = attachment?.attachedInvoiceNumbers ?? [];
  const [body, setBody] = useState(draftMeta.body);
  const [rewriteContext, setRewriteContext] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setBody(draftMeta.body);
    setRewriteContext('');
    setIsEditing(false);
  }, [draftMeta]);

  const handleEditFirst = useCallback(() => {
    setIsEditing(true);
    requestAnimationFrame(() => bodyRef.current?.focus());
  }, []);

  const handleSend = useCallback(() => {
    if (!body.trim()) return;
    appendCanSpamFooter(body);
    toast.success('Reply sent (mock)');
  }, [body]);

  const handleRewriteSubmit = useCallback(() => {
    if (!rewriteContext.trim()) return;
    toast.message('Rewriting draft with your context…');
    setRewriteContext('');
  }, [rewriteContext]);

  const invoiceCount = attachedInvoiceNumbers.length;
  const invoiceLabel =
    invoiceCount > 0
      ? `${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'} auto-attached`
      : 'No invoices attached';

  return (
    <article
      id='agent-draft-panel'
      className={cn(
        'flex w-full min-w-0 flex-col gap-3 rounded-2xl bg-violet-50 px-4 py-4 dark:bg-violet-950/25',
        className
      )}
    >
      <header className='flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3'>
        <h3 className='text-violet-950 text-sm font-semibold dark:text-violet-100'>
          AI-drafted reply
        </h3>
        <p className='text-muted-foreground text-xs sm:text-right'>
          Based on thread context + payment history
        </p>
      </header>

      <Textarea
        ref={bodyRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        readOnly={!isEditing}
        rows={10}
        className={cn(
          'min-h-[12rem] resize-y rounded-2xl border-0 bg-white px-4 py-3 text-sm leading-relaxed shadow-none',
          'focus-visible:ring-violet-200 dark:bg-white/95 dark:focus-visible:ring-violet-800',
          !isEditing && 'text-foreground cursor-default'
        )}
        aria-label='AI-drafted reply body'
      />

      <div className='bg-muted/70 text-muted-foreground rounded-xl px-3 py-2 text-xs'>
        <span className='text-foreground font-medium'>{invoiceLabel}</span>
        {invoiceCount > 0 ? (
          <span className='ml-2 tabular-nums'>{attachedInvoiceNumbers.join(' · ')}</span>
        ) : null}
      </div>

      <div className='flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between'>
        <input
          type='text'
          value={rewriteContext}
          onChange={(e) => setRewriteContext(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleRewriteSubmit();
            }
          }}
          placeholder='Add context for AI to rewrite'
          className={cn(
            'border-muted-foreground/35 text-foreground placeholder:text-muted-foreground',
            'h-10 w-full min-w-0 rounded-full border border-dashed bg-transparent px-4 text-sm',
            'focus-visible:ring-violet-300 outline-none focus-visible:ring-2 sm:max-w-md'
          )}
          aria-label='Add context for AI to rewrite'
        />
        <div className='flex shrink-0 items-center justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            className='rounded-full'
            onClick={handleEditFirst}
          >
            Edit first
          </Button>
          <Button
            type='button'
            className='rounded-full bg-[#B8956F] text-white hover:bg-[#A8845E] dark:bg-[#B8956F] dark:hover:bg-[#A8845E]'
            onClick={handleSend}
          >
            Send as-is
          </Button>
        </div>
      </div>
    </article>
  );
}
