'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import InputBar from '@/components/chat/input-bar';
import { ModeSelector } from '@/components/chat/mode-selector';
import { ModelPicker } from '@/components/chat/model-picker';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
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

function replySubjectLine(subject: string): string {
  const base = subject.replace(/^Re:\s*/i, '');
  return `Re: ${base}`;
}

interface InboxFloatingComposerProps {
  draft: string;
  replySubject: string;
  customerStatus: CollectionStatus;
  defaultTone?: AgentConfig['tone'];
  overlayClassName?: string;
  onOverlayHeightChange?: (height: number) => void;
}

export function InboxFloatingComposer({
  draft,
  replySubject,
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
        'pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-4',
        overlayClassName
      )}
    >
      <div className='pointer-events-auto mx-auto w-full max-w-full px-3 pb-1'>
        <p className='text-muted-foreground truncate px-1 text-xs'>
          <span className='font-medium'>Subject:</span> {replySubjectLine(replySubject)}
        </p>
      </div>
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
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 gap-1.5 rounded-full px-2.5 text-xs font-medium'
              onClick={() => applyDraft({ notify: true, showLoading: true })}
              disabled={isDrafting}
              isLoading={isDrafting}
            >
              <Icons.sparkles className='size-3.5 shrink-0' />
              Draft with RevCollect
            </Button>
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
