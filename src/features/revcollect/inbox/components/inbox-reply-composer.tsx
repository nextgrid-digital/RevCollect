'use client';

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useTransition
} from 'react';
import InputBar from '@/components/chat/input-bar';
import { ModeSelector } from '@/components/chat/mode-selector';
import { ModelPicker } from '@/components/chat/model-picker';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import {
  useAgentConfig,
  useCustomers,
  useInboxMessages,
  useRewriteAgentDraft,
  useSendInboxFollowUp,
  useWorkspaceGeneralSettings
} from '../../api/queries';
import type { AgentConfig, CollectionStatus, Customer } from '../../types';
import {
  COLLECTION_PLAYBOOKS,
  COLLECTION_TONES,
  defaultPlaybookForCustomer,
  type CollectionPlaybook,
  type CollectionTone
} from '../composer-options';
import { COLLECTION_SEND_NOTE } from '../../compliance/can-spam';
import { isDeliverableCustomerEmail } from '../../lib/customer-email';
import { confirmSameDayRecipientSend, otherOpenAccountsForEmail } from '../lib/same-day-recipient';
import { followUpDecision, policyFromCustomer } from '../../lib/relationship-policy';
import { cn } from '@/lib/utils';
import { MotionPressable } from '@/features/revcollect/motion/motion-primitives';
import { buildCollectionDraft } from '../lib/build-collection-draft';
import { InboxAttachedInvoiceChips } from './inbox-attached-invoice-chips';
import { useOptionalInboxThreadAttachment } from './inbox-thread-attachment-context';
import {
  findInboxThreadScrollContainer,
  scrollInboxThreadToBottomAfterLayout
} from '../lib/scroll-inbox-reply-target';

function draftStorageKey(messageId?: string, customerId?: string): string | null {
  if (messageId) return `revcollect:draft:${messageId}`;
  if (customerId) return `revcollect:draft:customer:${customerId}`;
  return null;
}

function readStoredDraft(key: string | null): string {
  if (!key || typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeStoredDraft(key: string | null, value: string): void {
  if (!key || typeof window === 'undefined') return;
  try {
    if (!value.trim()) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, value);
  } catch {
    // Ignore quota / private mode failures.
  }
}

function InboxDraftButton({
  isLoading,
  isDrafted,
  onClick
}: {
  isLoading: boolean;
  isDrafted: boolean;
  onClick: () => void;
}) {
  return (
    <MotionPressable
      disabled={isLoading}
      aria-busy={isLoading || undefined}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5',
        'border border-transparent text-[11px] font-medium leading-none',
        'transition-[color,background-color,box-shadow] duration-150',
        'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        'disabled:pointer-events-none disabled:opacity-60',
        isDrafted
          ? 'bg-violet-600 text-white hover:bg-violet-600/90 dark:bg-violet-500 dark:hover:bg-violet-500/90'
          : 'bg-accent text-accent-foreground hover:bg-accent/90'
      )}
    >
      {isLoading ? (
        <Icons.spinner className='size-3 shrink-0 animate-spin' />
      ) : (
        <Icons.sparkles className='size-3 shrink-0' />
      )}
      <span className='whitespace-nowrap'>Draft with RevCollect</span>
    </MotionPressable>
  );
}

interface ComposerToolbarProps {
  tone: CollectionTone;
  playbook: CollectionPlaybook;
  isDrafting: boolean;
  isDrafted: boolean;
  onToneChange: (toneId: string) => void;
  onPlaybookChange: (playbookId: string) => void;
  onDraftClick: () => void;
}

const ComposerToolbar = memo(function ComposerToolbar({
  tone,
  playbook,
  isDrafting,
  isDrafted,
  onToneChange,
  onPlaybookChange,
  onDraftClick
}: ComposerToolbarProps) {
  return (
    <div className='flex min-w-0 flex-wrap items-center gap-1'>
      <InboxDraftButton isLoading={isDrafting} isDrafted={isDrafted} onClick={onDraftClick} />
      <ModeSelector modes={COLLECTION_TONES} value={tone} onChange={onToneChange} />
      <ModelPicker
        models={COLLECTION_PLAYBOOKS}
        value={playbook}
        onChange={onPlaybookChange}
        placeholder='Playbook'
      />
    </div>
  );
});

export interface InboxReplyComposerHandle {
  send: () => void;
  focusEditor: () => void;
}

export interface InboxReplyComposerProps {
  baseDraft: string;
  customerStatus: CollectionStatus;
  customerId?: string;
  messageId?: string;
  customer?: Customer;
  defaultTone?: AgentConfig['tone'];
  initialBody?: string;
  defaultAutoRun?: boolean;
  bodyCollapsed?: boolean;
  variant?: 'default' | 'agent-draft';
  className?: string;
  autoFocus?: boolean;
}

export const InboxReplyComposer = forwardRef<InboxReplyComposerHandle, InboxReplyComposerProps>(
  function InboxReplyComposer(
    {
      baseDraft,
      customerStatus,
      customerId,
      messageId,
      customer,
      defaultTone,
      initialBody,
      bodyCollapsed = false,
      variant = 'default',
      className,
      autoFocus = false
    },
    ref
  ) {
    const isAgentDraft = variant === 'agent-draft';
    const rootRef = useRef<HTMLDivElement>(null);
    const { data: agentConfig } = useAgentConfig();
    const { data: workspaceSettings } = useWorkspaceGeneralSettings();
    const sendFollowUp = useSendInboxFollowUp();
    const { data: customers = [] } = useCustomers();
    const { data: inboxMessages = [] } = useInboxMessages();
    const sendingRef = useRef(false);
    const sendKeyRef = useRef<string | null>(null);
    const recordRetryRef = useRef(false);
    const [outboundLocked, setOutboundLocked] = useState(false);
    const rewriteDraft = useRewriteAgentDraft();
    const attachment = useOptionalInboxThreadAttachment();
    const signature =
      workspaceSettings?.emailSignature?.trim() || agentConfig?.signature?.trim() || 'Best regards';
    const resolvedDefaultTone = defaultTone ?? agentConfig?.tone ?? 'professional';
    const resolvedPlaybook = defaultPlaybookForCustomer(customerStatus, {
      paymentClaimed: customer
        ? followUpDecision(customer).draftKind === 'payment_verification'
        : false,
      allowLegalLanguage: agentConfig?.behaviors.allowLegalLanguage
    });
    const storageKey = draftStorageKey(messageId, customerId);
    const recipientEmail = customer
      ? (policyFromCustomer(customer).preferredEmail ?? customer.email)
      : undefined;
    const deliverableEmail = isDeliverableCustomerEmail(recipientEmail);
    const sharedAccounts = otherOpenAccountsForEmail(
      customers,
      customer?.id ?? '',
      recipientEmail ?? ''
    );
    const sharedRecipientCount = sharedAccounts.length;

    const [tone, setTone] = useState<CollectionTone>(resolvedDefaultTone);
    const [playbook, setPlaybook] = useState<CollectionPlaybook>(resolvedPlaybook);
    const [body, setBody] = useState(() => initialBody ?? readStoredDraft(storageKey));
    const [isDrafting, startDrafting] = useTransition();

    const isDrafted = body.trim().length > 0;
    const placeholder = deliverableEmail
      ? 'Write your reply...'
      : 'Add a deliverable email before sending';

    const baseDraftRef = useRef(baseDraft);
    const toneRef = useRef(tone);
    const playbookRef = useRef(playbook);
    const signatureRef = useRef(signature);

    baseDraftRef.current = baseDraft;
    toneRef.current = tone;
    playbookRef.current = playbook;
    signatureRef.current = signature;

    const setBodyIfChanged = useCallback((next: string) => {
      setBody((prev) => (prev === next ? prev : next));
    }, []);

    useEffect(() => {
      writeStoredDraft(storageKey, body);
    }, [body, storageKey]);

    const applyLocalDraft = useCallback(
      (options?: { notify?: boolean; showLoading?: boolean }) => {
        const run = () => {
          setBodyIfChanged(
            buildCollectionDraft({
              baseDraft: baseDraftRef.current,
              tone: toneRef.current,
              playbook: playbookRef.current,
              signature: signatureRef.current,
              customerName: customer?.name
            })
          );
          if (options?.notify) {
            toast.message('Draft ready — review and edit before sending');
          }
        };
        if (options?.showLoading) {
          startDrafting(run);
        } else {
          run();
        }
      },
      [customer?.name, setBodyIfChanged]
    );

    const handleDraftClick = useCallback(() => {
      if (!customerId) {
        applyLocalDraft({ notify: true, showLoading: true });
        return;
      }
      startDrafting(() => {
        const seeded = buildCollectionDraft({
          baseDraft: baseDraftRef.current,
          tone: toneRef.current,
          playbook: playbookRef.current,
          signature: signatureRef.current,
          customerName: customer?.name
        });
        rewriteDraft.mutate(
          {
            customerId,
            body: seeded,
            instruction: `Rewrite this collections follow-up in a ${toneRef.current} tone for this specific customer. Keep their name, invoice numbers, amounts, and due dates. Do not invent facts. One greeting, one body, one sign-off.`
          },
          {
            onSuccess: (result) => {
              setBodyIfChanged(result.body);
              toast.message('Draft ready — review and edit before sending');
            },
            onError: () => {
              setBodyIfChanged(seeded);
              toast.message('Draft ready — review and edit before sending');
            }
          }
        );
      });
    }, [applyLocalDraft, customer?.name, customerId, rewriteDraft, setBodyIfChanged]);

    useEffect(() => {
      const nextTone = resolvedDefaultTone;
      const nextPlaybook = defaultPlaybookForCustomer(customerStatus, {
        paymentClaimed: customer
          ? followUpDecision(customer).draftKind === 'payment_verification'
          : false,
        allowLegalLanguage: agentConfig?.behaviors.allowLegalLanguage
      });
      setTone(nextTone);
      setPlaybook(nextPlaybook);
      if (initialBody) {
        setBodyIfChanged(initialBody);
      } else {
        const stored = readStoredDraft(draftStorageKey(messageId, customerId));
        setBodyIfChanged(stored);
      }
    }, [
      customerStatus,
      customer,
      agentConfig?.behaviors.allowLegalLanguage,
      resolvedDefaultTone,
      initialBody,
      messageId,
      customerId,
      setBodyIfChanged
    ]);

    useLayoutEffect(() => {
      if (!isDrafted || isAgentDraft) return;

      const container = findInboxThreadScrollContainer(rootRef.current);
      if (!container) return;

      void scrollInboxThreadToBottomAfterLayout(container, { behavior: 'auto' });
    }, [isDrafted, isAgentDraft, body]);

    const handleToneChange = useCallback((toneId: string) => {
      setTone(toneId as CollectionTone);
    }, []);

    const handlePlaybookChange = useCallback((playbookId: string) => {
      setPlaybook(playbookId as CollectionPlaybook);
    }, []);

    const handleSend = useCallback(() => {
      const sentBody = body.trim();
      if (!sentBody || outboundLocked || sendingRef.current || sendFollowUp.isPending) return;
      if (!customerId) {
        toast.error('No customer on this thread');
        return;
      }
      if (!deliverableEmail) {
        toast.error('Add a deliverable email address before sending');
        return;
      }
      if (
        !confirmSameDayRecipientSend({
          company: customer?.company ?? 'this account',
          customerId,
          recipientEmail: recipientEmail ?? '',
          customers,
          inboxMessages
        })
      ) {
        return;
      }
      const idempotencyKey = sendKeyRef.current ?? crypto.randomUUID();
      sendKeyRef.current = idempotencyKey;
      recordRetryRef.current = false;
      sendingRef.current = true;
      setBody('');
      writeStoredDraft(storageKey, '');

      const payload = {
        customerId,
        messageId,
        originalBody: baseDraft,
        sentBody,
        kind: 'reply' as const,
        attachedInvoiceIds: attachment?.attachedInvoiceIds,
        idempotencyKey
      };

      const onSuccess = (result: { recorded?: boolean }) => {
        if (result.recorded === false) {
          setOutboundLocked(true);
          if (!recordRetryRef.current) {
            recordRetryRef.current = true;
            sendingRef.current = true;
            sendFollowUp.mutate(payload, {
              onSuccess,
              onSettled: () => {
                sendingRef.current = false;
              }
            });
          }
          return;
        }
        sendKeyRef.current = null;
        recordRetryRef.current = false;
        setOutboundLocked(false);
      };

      sendFollowUp.mutate(payload, {
        onSuccess,
        onError: () => setBody(sentBody),
        onSettled: () => {
          sendingRef.current = false;
        }
      });
    }, [
      attachment?.attachedInvoiceIds,
      baseDraft,
      body,
      customer,
      customerId,
      customers,
      deliverableEmail,
      inboxMessages,
      messageId,
      outboundLocked,
      recipientEmail,
      sendFollowUp,
      storageKey
    ]);

    useImperativeHandle(
      ref,
      () => ({
        send: handleSend,
        focusEditor: () => {
          rootRef.current?.querySelector('textarea')?.focus();
        }
      }),
      [handleSend]
    );

    const drafting = isDrafting || rewriteDraft.isPending;

    return (
      <div ref={rootRef} className={cn('space-y-2', className)}>
        {attachment ? (
          <InboxAttachedInvoiceChips
            invoices={attachment.attachedInvoices}
            onDetach={attachment.detachInvoice}
            disabled={sendFollowUp.isPending}
          />
        ) : null}
        <InputBar
          fillWidth
          maxTextareaHeight={360}
          bodyCollapsed={bodyCollapsed}
          autoFocus={autoFocus}
          className='px-0 pt-0 pb-0'
          value={body}
          onChange={setBody}
          placeholder={placeholder}
          onSend={handleSend}
          disabled={sendFollowUp.isPending || outboundLocked || !deliverableEmail}
          wrapActions
          leftActions={
            isAgentDraft ? undefined : (
              <ComposerToolbar
                tone={tone}
                playbook={playbook}
                isDrafting={drafting}
                isDrafted={isDrafted}
                onToneChange={handleToneChange}
                onPlaybookChange={handlePlaybookChange}
                onDraftClick={handleDraftClick}
              />
            )
          }
        />
        {!deliverableEmail ? (
          <p className='text-destructive px-1 text-[11px] leading-relaxed'>
            Needs a contact. Add a deliverable email before sending.
            {customer?.phone ? ` Phone: ${customer.phone}` : ''}
          </p>
        ) : (
          <div className='space-y-1 px-1'>
            {sharedRecipientCount > 0 ? (
              <p className='text-amber-800 text-[11px] leading-relaxed dark:text-amber-300'>
                This address is also on {sharedAccounts.map((item) => item.company).join(', ')}.
                Sending here only covers this account. A second email to this address today asks you
                to confirm.
              </p>
            ) : null}
            {outboundLocked ? (
              <p className='text-[11px] leading-relaxed text-amber-800 dark:text-amber-300'>
                This follow-up went out. It is not in the thread yet, so don&apos;t send it again.
              </p>
            ) : null}
            <p className='text-muted-foreground text-[11px] leading-relaxed'>
              {COLLECTION_SEND_NOTE}
            </p>
          </div>
        )}
      </div>
    );
  }
);
