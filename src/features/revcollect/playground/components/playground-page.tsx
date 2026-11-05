'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  useAgentConfig,
  useCustomers,
  useDecisionTraces,
  useRunPlaygroundDecision,
  useSaveDecisionNote,
  useUpdateAgentConfig
} from '@/features/revcollect/api/queries';
import { cn } from '@/lib/utils';
import type { AgentFollowUpStyle } from '@/features/revcollect/types';
import { followUpStyleToTone } from '@/features/revcollect/agent/lib/follow-up-style';
import { outcomeCopy } from '../lib/trace-language';

const PlaygroundCanvas = dynamic(
  () => import('./playground-canvas').then((mod) => mod.PlaygroundCanvas),
  {
    ssr: false,
    loading: () => (
      <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
        Loading the pipeline…
      </div>
    )
  }
);

export function PlaygroundPage() {
  const customers = useCustomers();
  const traces = useDecisionTraces();
  const config = useAgentConfig();
  const saveConfig = useUpdateAgentConfig();
  const runDecision = useRunPlaygroundDecision();
  const saveNote = useSaveDecisionNote();
  const [mounted, setMounted] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [instruction, setInstruction] = useState('');
  const [followUpStyle, setFollowUpStyle] = useState<AgentFollowUpStyle>('balanced');
  const [instructionReady, setInstructionReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!config.data || instructionReady) return;
    setInstruction(config.data.draftInstruction ?? '');
    setFollowUpStyle(config.data.followUpStyle ?? 'balanced');
    setInstructionReady(true);
  }, [config.data, instructionReady]);

  const rows = traces.data ?? [];
  const selected = mounted
    ? (rows.find((item) => item.id === selectedId) ?? rows[0] ?? null)
    : null;

  useEffect(() => {
    setNote(selected?.note ?? '');
  }, [selected?.id, selected?.note]);

  const customerOptions = customers.data ?? [];

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle title='Playground' className='h-8 shrink-0' />
      <div className='flex min-h-0 flex-1 flex-col gap-4 lg:flex-row'>
        <WorkspaceCard className='flex max-h-48 w-full shrink-0 flex-col overflow-hidden lg:max-h-none lg:w-64'>
          <div className='flex min-h-0 flex-1 flex-col p-3'>
            <p className='text-muted-foreground px-2 pb-2 text-xs font-medium'>Past runs</p>
            <div className='min-h-0 flex-1 overflow-y-auto'>
              {!mounted || traces.isPending ? (
                <p className='text-muted-foreground p-2 text-sm'>Loading decisions…</p>
              ) : rows.length === 0 ? (
                <p className='text-muted-foreground p-2 text-sm'>No decisions yet.</p>
              ) : (
                rows.map((trace) => (
                  <button
                    key={trace.id}
                    type='button'
                    className={cn(
                      'hover:bg-muted/60 w-full rounded-md px-2 py-2 text-left text-sm',
                      selected?.id === trace.id && 'bg-muted'
                    )}
                    onClick={() => setSelectedId(trace.id)}
                  >
                    <span className='block truncate font-medium'>{trace.company}</span>
                    <span className='text-muted-foreground block truncate' suppressHydrationWarning>
                      {outcomeCopy(trace)} ·{' '}
                      {new Date(trace.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </WorkspaceCard>
        <div className='flex min-h-0 min-w-0 flex-1'>
          <PlaygroundCanvas
            toolbar={
              <div className='flex items-center gap-2'>
                <label htmlFor='playground-customer' className='sr-only'>
                  Customer
                </label>
                <Select
                  value={customerId || 'none'}
                  onValueChange={(value) => setCustomerId(value === 'none' ? '' : value)}
                >
                  <SelectTrigger id='playground-customer' className='w-full max-w-xs'>
                    <SelectValue placeholder='Select a customer' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>Select a customer</SelectItem>
                    {mounted
                      ? customerOptions.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.company}
                          </SelectItem>
                        ))
                      : null}
                  </SelectContent>
                </Select>
                <Button
                  type='button'
                  size='sm'
                  className='shrink-0'
                  isLoading={runDecision.isPending}
                  disabled={!customerId}
                  onClick={() => {
                    runDecision.mutate(customerId, {
                      onSuccess: (trace) => setSelectedId(trace.id)
                    });
                  }}
                >
                  Run
                </Button>
              </div>
            }
            trace={selected}
            instruction={instruction}
            onInstruction={setInstruction}
            followUpStyle={followUpStyle}
            onFollowUpStyle={setFollowUpStyle}
            onSaveDraftSettings={() => {
              if (!config.data) return;
              saveConfig.mutate({
                ...config.data,
                followUpStyle,
                tone: followUpStyleToTone(followUpStyle),
                draftInstruction: instruction
              });
            }}
            savingDraftSettings={saveConfig.isPending}
            draftSettingsDisabled={!config.data}
            note={note}
            onNote={setNote}
            onSaveNote={() => {
              if (!selected) return;
              saveNote.mutate({ traceId: selected.id, note });
            }}
            savingNote={saveNote.isPending}
            canSaveNote={Boolean(selected)}
          />
        </div>
      </div>
    </WorkspaceCanvas>
  );
}
