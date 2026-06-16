'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
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
  const [isSent, setIsSent] = useState(false);
  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setBody(draftMeta.body);
    setIsSent(false);
    setAiEditOpen(false);
    setAiPrompt('');
  }, [draftMeta]);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [body, isSent]);

  const handleSend = useCallback(() => {
    if (!body.trim() || isSent) return;
    appendCanSpamFooter(body);
    setIsSent(true);
    toast.success('Reply sent (mock)');
  }, [body, isSent]);

  const handleDetachInvoice = useCallback(
    (invoiceNumber: string) => {
      attachment?.detachInvoice(invoiceNumber);
    },
    [attachment]
  );

  const handleAiRewrite = useCallback(() => {
    if (!aiPrompt.trim() || isSent) return;
    toast.success('Draft rewritten (mock)');
    setAiEditOpen(false);
    setAiPrompt('');
  }, [aiPrompt, isSent]);

  return (
    <article
      id='agent-draft-panel'
      className={cn(
        'border-border scroll-mt-4 flex w-full min-w-0 flex-col gap-3 rounded-2xl border bg-muted/50 px-4 py-4',
        className
      )}
    >
      <header className='flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3'>
        <h3 className='text-foreground text-sm font-semibold'>AI-drafted reply</h3>
        <p className='text-muted-foreground text-xs sm:text-right'>
          Based on thread context + payment history
        </p>
      </header>

      {attachedInvoiceNumbers.length > 0 ? (
        <div className='flex flex-wrap gap-2'>
          {attachedInvoiceNumbers.map((invoiceNumber) => (
            <div
              key={invoiceNumber}
              className='bg-muted/70 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs'
            >
              <Icons.fileTypePdf className='text-muted-foreground size-3.5 shrink-0' />
              <span className='text-foreground font-medium tabular-nums'>{invoiceNumber}</span>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-foreground size-5 shrink-0'
                onClick={() => handleDetachInvoice(invoiceNumber)}
                aria-label={`Remove ${invoiceNumber}`}
              >
                <Icons.close className='size-3' />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className='text-muted-foreground text-xs'>No invoices attached</p>
      )}

      <div className='border-input bg-card overflow-hidden rounded-2xl border'>
        <Textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          readOnly={isSent}
          rows={1}
          className={cn(
            'text-card-foreground min-h-0 resize-y rounded-none border-0 bg-transparent px-4 py-3 text-sm leading-relaxed shadow-none',
            'focus-visible:border-transparent focus-visible:ring-0',
            isSent && 'cursor-default resize-none opacity-80'
          )}
          aria-label='AI-drafted reply body'
          aria-readonly={isSent}
        />

        <div className='border-border flex items-center justify-between gap-2 border-t px-3 py-2'>
          <Popover open={aiEditOpen} onOpenChange={setAiEditOpen}>
            <PopoverTrigger asChild>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='rounded-full'
                disabled={isSent}
              >
                <Icons.sparkles className='size-3.5' />
                Edit with AI
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side='top'
              align='start'
              sideOffset={8}
              className='w-[min(20rem,calc(100vw-2rem))] p-3'
            >
              <div className='flex flex-col gap-2'>
                <p className='text-foreground text-xs font-medium'>How should AI edit this?</p>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder='e.g. Make it shorter and friendlier'
                  rows={3}
                  autoFocus
                  className='min-h-0 resize-none text-sm'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleAiRewrite();
                    }
                  }}
                />
                <div className='flex justify-end gap-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setAiEditOpen(false);
                      setAiPrompt('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    disabled={!aiPrompt.trim()}
                    onClick={handleAiRewrite}
                  >
                    Rewrite
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type='button'
            size='sm'
            className='rounded-full'
            disabled={isSent || !body.trim()}
            onClick={handleSend}
          >
            {isSent ? 'Sent' : 'Send'}
            {!isSent ? <Icons.send className='size-3.5' /> : null}
          </Button>
        </div>
      </div>
    </article>
  );
}
