'use client';

import { memo, useCallback, useEffect, useId, useRef, useState, useTransition } from 'react';
import InputBar from '@/components/chat/input-bar';
import { ModeSelector } from '@/components/chat/mode-selector';
import { ModelPicker } from '@/components/chat/model-picker';
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAgentConfig } from '../../api/queries';
import { appendCanSpamFooter } from '../../compliance/can-spam';
import type { AgentConfig, CollectionStatus } from '../../types';
import {
  COLLECTION_PLAYBOOKS,
  COLLECTION_TONES,
  defaultPlaybookForStatus,
  type CollectionPlaybook,
  type CollectionTone
} from '../composer-options';
import { cn } from '@/lib/utils';
import { buildCollectionDraft } from '../lib/build-collection-draft';

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
    <button
      type='button'
      disabled={isLoading}
      aria-busy={isLoading || undefined}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5',
        'border border-transparent text-[11px] font-medium leading-none',
        'transition-[color,background-color,box-shadow,transform] duration-150',
        'active:scale-[0.98]',
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
    </button>
  );
}

function makeDraftBody(
  draft: string,
  tone: CollectionTone,
  playbook: CollectionPlaybook,
  signature: string
): string {
  return buildCollectionDraft({
    baseDraft: draft,
    tone,
    playbook,
    signature
  });
}

interface ComposerToolbarProps {
  autoRunId: string;
  autoRun: boolean;
  tone: CollectionTone;
  playbook: CollectionPlaybook;
  isDrafting: boolean;
  isDrafted: boolean;
  onAutoRunChange: (checked: boolean) => void;
  onToneChange: (toneId: string) => void;
  onPlaybookChange: (playbookId: string) => void;
  onDraftClick: () => void;
}

const ComposerToolbar = memo(function ComposerToolbar({
  autoRunId,
  autoRun,
  tone,
  playbook,
  isDrafting,
  isDrafted,
  onAutoRunChange,
  onToneChange,
  onPlaybookChange,
  onDraftClick
}: ComposerToolbarProps) {
  return (
    <>
      <InboxDraftButton isLoading={isDrafting} isDrafted={isDrafted} onClick={onDraftClick} />
      <ModeSelector modes={COLLECTION_TONES} value={tone} onChange={onToneChange} />
      <ModelPicker
        models={COLLECTION_PLAYBOOKS}
        value={playbook}
        onChange={onPlaybookChange}
        placeholder='Playbook'
      />
      <div className='border-border ml-0.5 flex shrink-0 items-center gap-1.5 border-l pl-2.5'>
        <Switch
          id={autoRunId}
          checked={autoRun}
          onCheckedChange={onAutoRunChange}
          className='scale-90'
        />
        <Label
          htmlFor={autoRunId}
          className='text-muted-foreground cursor-pointer text-xs font-normal whitespace-nowrap'
        >
          Auto-run
        </Label>
      </div>
    </>
  );
});

export interface InboxReplyComposerProps {
  baseDraft: string;
  customerStatus: CollectionStatus;
  defaultTone?: AgentConfig['tone'];
  initialBody?: string;
  defaultAutoRun?: boolean;
  bodyCollapsed?: boolean;
  className?: string;
}

export function InboxReplyComposer({
  baseDraft,
  customerStatus,
  defaultTone,
  initialBody,
  defaultAutoRun = false,
  bodyCollapsed = false,
  className
}: InboxReplyComposerProps) {
  const autoRunId = useId();
  const { data: agentConfig } = useAgentConfig();
  const signature = agentConfig?.signature ?? 'Best regards,\nRevCollect Collections Team';
  const resolvedDefaultTone = defaultTone ?? agentConfig?.tone ?? 'professional';

  const [tone, setTone] = useState<CollectionTone>(resolvedDefaultTone);
  const [playbook, setPlaybook] = useState<CollectionPlaybook>(() =>
    defaultPlaybookForStatus(customerStatus)
  );
  const [body, setBody] = useState(initialBody ?? '');
  const [autoRun, setAutoRun] = useState(defaultAutoRun);
  const [isDrafting, startDrafting] = useTransition();

  const isDrafted = body.trim().length > 0;
  const placeholder = 'Write your reply...';

  const baseDraftRef = useRef(baseDraft);
  const toneRef = useRef(tone);
  const playbookRef = useRef(playbook);
  const signatureRef = useRef(signature);
  const skipNextAutoRunRef = useRef(Boolean(initialBody));

  baseDraftRef.current = baseDraft;
  toneRef.current = tone;
  playbookRef.current = playbook;
  signatureRef.current = signature;

  const setBodyIfChanged = useCallback((next: string) => {
    setBody((prev) => (prev === next ? prev : next));
  }, []);

  const applyDraft = useCallback(
    (options?: {
      tone?: CollectionTone;
      playbook?: CollectionPlaybook;
      notify?: boolean;
      showLoading?: boolean;
    }) => {
      const run = () => {
        setBodyIfChanged(
          makeDraftBody(
            baseDraftRef.current,
            options?.tone ?? toneRef.current,
            options?.playbook ?? playbookRef.current,
            signatureRef.current
          )
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
    [setBodyIfChanged]
  );

  useEffect(() => {
    const nextTone = resolvedDefaultTone;
    const nextPlaybook = defaultPlaybookForStatus(customerStatus);
    setTone(nextTone);
    setPlaybook(nextPlaybook);
    setAutoRun(defaultAutoRun);
    skipNextAutoRunRef.current = Boolean(initialBody);
    if (initialBody) {
      setBodyIfChanged(initialBody);
    } else {
      setBodyIfChanged('');
    }
  }, [
    baseDraft,
    customerStatus,
    resolvedDefaultTone,
    initialBody,
    defaultAutoRun,
    setBodyIfChanged
  ]);

  useEffect(() => {
    if (!autoRun) return;
    if (skipNextAutoRunRef.current) {
      skipNextAutoRunRef.current = false;
      return;
    }
    setBodyIfChanged(makeDraftBody(baseDraft, tone, playbook, signature));
  }, [autoRun, baseDraft, tone, playbook, signature, setBodyIfChanged]);

  const handleAutoRunChange = useCallback(
    (checked: boolean) => {
      setAutoRun((prev) => (prev === checked ? prev : checked));
      if (!checked) {
        setBodyIfChanged(initialBody ?? '');
      }
    },
    [initialBody, setBodyIfChanged]
  );

  const handleToneChange = useCallback((toneId: string) => {
    setTone(toneId as CollectionTone);
  }, []);

  const handlePlaybookChange = useCallback((playbookId: string) => {
    setPlaybook(playbookId as CollectionPlaybook);
  }, []);

  const handleDraftClick = useCallback(() => {
    applyDraft({ notify: true, showLoading: true });
  }, [applyDraft]);

  const handleSend = useCallback(() => {
    if (!body.trim()) return;
    appendCanSpamFooter(body);
    toast.success('Reply sent (mock)');
  }, [body]);

  return (
    <div className={cn('space-y-0', className)}>
      <InputBar
        fillWidth
        maxTextareaHeight={360}
        bodyCollapsed={bodyCollapsed}
        className='px-0 pt-0 pb-0'
        value={body}
        onChange={setBody}
        placeholder={placeholder}
        onSend={handleSend}
        leftActions={
          <ComposerToolbar
            autoRunId={autoRunId}
            autoRun={autoRun}
            tone={tone}
            playbook={playbook}
            isDrafting={isDrafting}
            isDrafted={isDrafted}
            onAutoRunChange={handleAutoRunChange}
            onToneChange={handleToneChange}
            onPlaybookChange={handlePlaybookChange}
            onDraftClick={handleDraftClick}
          />
        }
      />
    </div>
  );
}
