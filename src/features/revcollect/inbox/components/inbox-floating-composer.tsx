'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import InputBar from '@/components/chat/input-bar';
import { ModeSelector } from '@/components/chat/mode-selector';
import { ModelPicker } from '@/components/chat/model-picker';
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { agentConfig } from '../../mock-data';
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

function InboxDraftButton({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) {
  return (
    <button
      type='button'
      disabled={isLoading}
      aria-busy={isLoading || undefined}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5',
        'border border-transparent bg-accent text-[11px] font-medium leading-none text-accent-foreground',
        'transition-[color,background-color,box-shadow,transform] duration-150',
        'hover:bg-accent/90 active:scale-[0.98]',
        'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        'disabled:pointer-events-none disabled:opacity-60'
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

interface InboxFloatingComposerProps {
  draft: string;
  customerStatus: CollectionStatus;
  defaultTone?: AgentConfig['tone'];
  overlayClassName?: string;
  onOverlayHeightChange?: (height: number) => void;
}

export function InboxFloatingComposer({
  draft,
  customerStatus,
  defaultTone = agentConfig.tone,
  overlayClassName,
  onOverlayHeightChange
}: InboxFloatingComposerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [tone, setTone] = useState<CollectionTone>(defaultTone);
  const [playbook, setPlaybook] = useState<CollectionPlaybook>(() =>
    defaultPlaybookForStatus(customerStatus)
  );
  const [body, setBody] = useState('');
  const [autoRun, setAutoRun] = useState(false);
  const [isDrafting, startDrafting] = useTransition();

  const applyDraft = useCallback(
    (options?: {
      tone?: CollectionTone;
      playbook?: CollectionPlaybook;
      notify?: boolean;
      showLoading?: boolean;
    }) => {
      const run = () => {
        setBody(
          buildCollectionDraft({
            baseDraft: draft,
            tone: options?.tone ?? tone,
            playbook: options?.playbook ?? playbook,
            signature: agentConfig.signature
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
    [draft, tone, playbook]
  );

  useEffect(() => {
    setTone(defaultTone);
    setPlaybook(defaultPlaybookForStatus(customerStatus));
  }, [draft, customerStatus, defaultTone]);

  useEffect(() => {
    if (autoRun) {
      setBody(
        buildCollectionDraft({
          baseDraft: draft,
          tone: defaultTone,
          playbook: defaultPlaybookForStatus(customerStatus),
          signature: agentConfig.signature
        })
      );
      return;
    }
    setBody('');
  }, [draft, customerStatus, defaultTone]);

  const handleAutoRunChange = useCallback(
    (checked: boolean) => {
      setAutoRun(checked);
      if (checked) {
        applyDraft();
      }
    },
    [applyDraft]
  );

  useEffect(() => {
    const el = overlayRef.current;
    if (!el || !onOverlayHeightChange) return;

    const report = () => onOverlayHeightChange(el.offsetHeight);

    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onOverlayHeightChange]);

  const handleToneChange = useCallback(
    (toneId: string) => {
      const nextTone = toneId as CollectionTone;
      setTone(nextTone);
      if (autoRun) {
        applyDraft({ tone: nextTone });
      }
    },
    [autoRun, applyDraft]
  );

  const handlePlaybookChange = useCallback(
    (playbookId: string) => {
      const nextPlaybook = playbookId as CollectionPlaybook;
      setPlaybook(nextPlaybook);
      if (autoRun) {
        applyDraft({ playbook: nextPlaybook });
      }
    },
    [autoRun, applyDraft]
  );

  return (
    <div
      ref={overlayRef}
      className={cn(
        'pointer-events-none absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background via-background/70 to-transparent pt-2 lg:right-[var(--inbox-panel-reserve)]',
        overlayClassName
      )}
    >
      <InputBar
        fillWidth
        maxTextareaHeight={360}
        className='pointer-events-auto pt-0'
        value={body}
        onChange={setBody}
        placeholder='Write your reply...'
        onSend={() => {
          toast.success('Reply sent (mock)');
        }}
        leftActions={
          <>
            <InboxDraftButton
              isLoading={isDrafting}
              onClick={() => applyDraft({ notify: true, showLoading: true })}
            />
            <ModeSelector modes={COLLECTION_TONES} value={tone} onChange={handleToneChange} />
            <ModelPicker
              models={COLLECTION_PLAYBOOKS}
              value={playbook}
              onChange={handlePlaybookChange}
              placeholder='Playbook'
            />
            <div className='border-border ml-0.5 flex shrink-0 items-center gap-1.5 border-l pl-2.5'>
              <Switch
                id='inbox-composer-auto-run'
                checked={autoRun}
                onCheckedChange={handleAutoRunChange}
                className='scale-90'
              />
              <Label
                htmlFor='inbox-composer-auto-run'
                className='text-muted-foreground cursor-pointer text-xs font-normal whitespace-nowrap'
              >
                Auto-run
              </Label>
            </div>
          </>
        }
      />
    </div>
  );
}
