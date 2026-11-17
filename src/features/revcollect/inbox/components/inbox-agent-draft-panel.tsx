'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { COLLECTION_SEND_NOTE } from '../../compliance/can-spam';
import {
  useCustomers,
  useInboxMessages,
  useRewriteAgentDraft,
  useSendInboxFollowUp
} from '../../api/queries';
import { confirmSameDayRecipientSend } from '../lib/same-day-recipient';
import { isDeliverableCustomerEmail } from '../../lib/customer-email';
import { policyFromCustomer } from '../../lib/relationship-policy';
import type { AgentDraftMeta } from '../../types';
import { InboxAttachedInvoiceChips } from './inbox-attached-invoice-chips';
import { useOptionalInboxThreadAttachment } from './inbox-thread-attachment-context';

interface InboxAgentDraftPanelProps {
  draftMeta: AgentDraftMeta;
  customerId: string;
  messageId?: string;
  className?: string;
}

export function InboxAgentDraftPanel({
  draftMeta,
  customerId,
  messageId,
  className
}: InboxAgentDraftPanelProps) {
  const attachment = useOptionalInboxThreadAttachment();
  const attachedInvoices = attachment?.attachedInvoices ?? [];
  const [body, setBody] = useState(draftMeta.body);
  const [isSent, setIsSent] = useState(false);
  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const sendFollowUp = useSendInboxFollowUp();
  const { data: customers = [] } = useCustomers();
  const { data: inboxMessages = [] } = useInboxMessages();
  const rewriteDraft = useRewriteAgentDraft();
  const sendKeyRef = useRef<string | null>(null);
  const recordRetryRef = useRef(false);
  const [outboundLocked, setOutboundLocked] = useState(false);
  const isSending = sendFollowUp.isPending;
  const isRewriting = rewriteDraft.isPending;

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
    if (!body.trim() || isSent || outboundLocked || isSending) return;
    const customer = customers.find((item) => item.id === customerId);
    const recipientEmail = customer
      ? (policyFromCustomer(customer).preferredEmail ?? customer.email)
      : '';
    if (!isDeliverableCustomerEmail(recipientEmail)) {
      toast.error('Add a deliverable email address before sending');
      return;
    }
    if (
      !confirmSameDayRecipientSend({
        company: customer?.company ?? 'this account',
        customerId,
        recipientEmail,
        customers,
        inboxMessages
      })
    ) {
      return;
    }
    const kind = body.trim() === draftMeta.body.trim() ? 'reply' : 'draft_edit';
    const idempotencyKey = sendKeyRef.current ?? crypto.randomUUID();
    sendKeyRef.current = idempotencyKey;
    recordRetryRef.current = false;
    const payload = {
      customerId,
      messageId,
      originalBody: draftMeta.body,
      sentBody: body,
      kind,
      attachedInvoiceIds: attachment?.attachedInvoiceIds,
      idempotencyKey
    } as const;
    const onSuccess = (result: { recorded?: boolean }) => {
      if (result.recorded === false) {
        setIsSent(true);
        setOutboundLocked(true);
        if (!recordRetryRef.current) {
          recordRetryRef.current = true;
          sendFollowUp.mutate(payload, { onSuccess });
        }
        return;
      }
      setIsSent(true);
      setOutboundLocked(false);
      sendKeyRef.current = null;
    };
    sendFollowUp.mutate(payload, { onSuccess });
  }, [
    attachment?.attachedInvoiceIds,
    body,
    customers,
    customerId,
    draftMeta.body,
    inboxMessages,
    isSending,
    isSent,
    messageId,
    outboundLocked,
    sendFollowUp
  ]);

  const handleDetachInvoice = useCallback(
    (invoiceId: string) => {
      attachment?.detachInvoice(invoiceId);
    },
    [attachment]
  );

  const handleAiRewrite = useCallback(() => {
    const instruction = aiPrompt.trim();
    if (!instruction || isSent || isRewriting) return;
    rewriteDraft.mutate(
      { customerId, body, instruction },
      {
        onSuccess: (result) => {
          setBody(result.body);
          setAiEditOpen(false);
          setAiPrompt('');
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'ARI could not rewrite this draft');
        }
      }
    );
  }, [aiPrompt, body, customerId, isRewriting, isSent, rewriteDraft]);

  return (
    <article
      id='agent-draft-panel'
      className={cn(
        'border-border scroll-mt-4 flex w-full min-w-0 flex-col gap-3 rounded-2xl border bg-muted/50 px-3 py-4 sm:px-4',
        className
      )}
    >
      <header className='flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3'>
        <h3 className='text-foreground text-sm font-semibold'>AI-drafted reply</h3>
        <p className='text-muted-foreground text-xs sm:text-right'>
          Based on thread context + payment history
        </p>
      </header>

      <InboxAttachedInvoiceChips
        invoices={attachedInvoices}
        onDetach={isSent ? undefined : handleDetachInvoice}
        disabled={isSent}
      />

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

        <div className='border-border flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2'>
          <Popover open={aiEditOpen} onOpenChange={setAiEditOpen}>
            <PopoverTrigger asChild>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='rounded-full'
                disabled={isSent || isRewriting}
              >
                <Icons.sparkles className='size-3.5' />
                <span className='sm:hidden'>AI</span>
                <span className='hidden sm:inline'>Edit with AI</span>
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
                    disabled={!aiPrompt.trim() || isRewriting}
                    isLoading={isRewriting}
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
            disabled={isSent || outboundLocked || isSending || !body.trim()}
            isLoading={isSending}
            onClick={handleSend}
          >
            {isSent ? 'Sent' : 'Send'}
            {!isSent && !isSending ? <Icons.send className='size-3.5' /> : null}
          </Button>
        </div>
      </div>
      {outboundLocked ? (
        <p className='text-[11px] leading-relaxed text-amber-800 dark:text-amber-300'>
          This follow-up went out. It is not in the thread yet, so don&apos;t send it again.
        </p>
      ) : !isSent ? (
        <p className='text-muted-foreground text-[11px] leading-relaxed'>{COLLECTION_SEND_NOTE}</p>
      ) : null}
    </article>
  );
}
