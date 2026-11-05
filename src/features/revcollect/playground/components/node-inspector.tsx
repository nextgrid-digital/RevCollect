'use client';

import { use } from 'react';
import { FOLLOW_UP_STYLE_OPTIONS } from '@/features/revcollect/agent/lib/follow-up-style';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { StepId } from '../lib/trace-language';
import { PlaygroundCanvasContext } from './playground-canvas-context';

interface NodeInspectorProps {
  stepId: StepId | null;
  onClose: () => void;
}

export function NodeInspector({ stepId, onClose }: NodeInspectorProps) {
  const canvas = use(PlaygroundCanvasContext);
  if (!canvas) return null;
  const step = stepId ? canvas.steps[stepId] : null;

  return (
    <aside className='flex h-full min-h-0 w-full flex-col'>
      {step || canvas.readout ? (
        <>
          <header className='flex items-start gap-2 border-b px-4 py-3'>
            <div className='min-w-0 flex-1'>
              <h2 className='text-sm font-medium'>{step ? step.title : 'This run'}</h2>
              <p className='text-muted-foreground text-xs leading-relaxed'>
                {step
                  ? step.summary
                  : 'The cost, what was scored, what the writer was given, the draft, and whether it was a good email.'}
              </p>
            </div>
            {step ? (
              <Button
                type='button'
                size='icon'
                variant='ghost'
                onClick={onClose}
                aria-label='Close settings'
              >
                <Icons.close className='size-4' />
              </Button>
            ) : null}
          </header>
          <div className='flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4'>
            {step?.id === 'decision' && step.detail ? (
              <pre className='bg-muted rounded-md p-3 text-xs whitespace-pre-wrap'>
                {step.detail}
              </pre>
            ) : null}
            {step?.id === 'gemini' ? <GeminiSettings /> : null}
            {step?.id === 'learn' ? <LearnSettings /> : null}
            {step && step.id !== 'gemini' && step.id !== 'learn' && step.id !== 'decision' ? (
              <p className='text-muted-foreground text-sm leading-relaxed'>
                Nothing is sent from this step.
              </p>
            ) : null}
            {step?.id === 'decision' ? (
              <p className='text-muted-foreground text-sm leading-relaxed'>
                These questions always run, in this order. You cannot skip one, and nothing on this
                page is sent.
              </p>
            ) : null}
            {canvas.readout ? <RunReadoutView /> : null}
          </div>
        </>
      ) : (
        <div className='text-muted-foreground flex flex-1 flex-col justify-center gap-2 p-4 text-sm'>
          <p className='text-foreground font-medium'>This run</p>
          <p>Pick a past run, or choose a customer and press Run.</p>
        </div>
      )}
    </aside>
  );
}

function RunReadoutView() {
  const canvas = use(PlaygroundCanvasContext);
  const readout = canvas?.readout;
  if (!readout) return null;

  return (
    <div className='flex flex-col gap-5'>
      <section className='flex flex-col gap-2'>
        <h3 className='text-sm font-medium'>What this run cost</h3>
        <ul className='flex flex-col gap-1.5 text-sm'>
          {readout.cost.map((line) => (
            <li key={line} className='bg-muted rounded-md px-3 py-2'>
              {line}
            </li>
          ))}
        </ul>
        <p className='text-muted-foreground text-xs leading-relaxed'>{readout.costNote}</p>
      </section>
      <section className='flex flex-col gap-2'>
        <h3 className='text-sm font-medium'>What Jev scored</h3>
        {readout.scores.length > 0 ? (
          <ul className='flex flex-col gap-1.5 text-sm'>
            {readout.scores.map((line) => (
              <li key={line} className='bg-muted rounded-md px-3 py-2'>
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-muted-foreground text-sm'>Jev did not score this run.</p>
        )}
        <p className='text-muted-foreground text-xs leading-relaxed'>
          Scores explain the notes. They do not decide whether we write, and nothing is sent.
        </p>
      </section>
      <section className='flex flex-col gap-2'>
        <h3 className='text-sm font-medium'>What the writer was given</h3>
        {readout.context ? (
          <pre className='bg-muted rounded-md p-3 text-xs leading-relaxed whitespace-pre-wrap'>
            {readout.context}
          </pre>
        ) : (
          <p className='text-muted-foreground text-sm'>Nothing was stored for this customer.</p>
        )}
      </section>
      <section className='flex flex-col gap-2'>
        <h3 className='text-sm font-medium'>The draft</h3>
        <p className='text-muted-foreground text-xs leading-relaxed'>{readout.draftNote}</p>
        {readout.draft ? (
          <pre className='bg-muted rounded-md p-3 text-xs leading-relaxed whitespace-pre-wrap'>
            {readout.draft}
          </pre>
        ) : null}
      </section>
      {readout.evals.length > 0 ? (
        <section className='flex flex-col gap-2'>
          <h3 className='text-sm font-medium'>Whether this email is good</h3>
          <ul className='flex flex-col gap-1.5 text-sm'>
            {readout.evals.map((line) => (
              <li key={line} className='bg-muted rounded-md px-3 py-2'>
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function GeminiSettings() {
  const canvas = use(PlaygroundCanvasContext);
  if (!canvas) return null;

  return (
    <div className='flex flex-col gap-4'>
      <fieldset className='flex flex-col gap-2'>
        <legend className='text-sm font-medium'>How the draft sounds</legend>
        {FOLLOW_UP_STYLE_OPTIONS.map((option) => {
          const selected = canvas.followUpStyle === option.id;
          return (
            <button
              key={option.id}
              type='button'
              aria-pressed={selected}
              disabled={canvas.draftSettingsDisabled}
              className={cn(
                'rounded-md border px-3 py-2 text-left',
                selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'
              )}
              onClick={() => canvas.onFollowUpStyle(option.id)}
            >
              <span className='block text-sm font-medium'>{option.label}</span>
              <span className='text-muted-foreground block text-xs'>{option.description}</span>
            </button>
          );
        })}
      </fieldset>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='playground-gemini-instruction'>What the writer must do</Label>
        <Textarea
          id='playground-gemini-instruction'
          value={canvas.instruction}
          onChange={(event) => canvas.onInstruction(event.target.value)}
          rows={5}
          disabled={canvas.draftSettingsDisabled}
          placeholder='Example: keep it to four lines and ask for a date.'
        />
      </div>
      <Button
        type='button'
        isLoading={canvas.savingDraftSettings}
        disabled={canvas.draftSettingsDisabled}
        onClick={canvas.onSaveDraftSettings}
      >
        Save draft settings
      </Button>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        The next email uses this tone and instruction. It is written only when we should write, and
        nothing here is sent.
      </p>
    </div>
  );
}

function LearnSettings() {
  const canvas = use(PlaygroundCanvasContext);
  if (!canvas) return null;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='playground-decision-note'>What you learned</Label>
        <Textarea
          id='playground-decision-note'
          value={canvas.note}
          onChange={(event) => canvas.onNote(event.target.value)}
          rows={5}
          disabled={!canvas.canSaveNote}
          placeholder='Kept on this run for the next time you look at it.'
        />
      </div>
      <Button
        type='button'
        variant='outline'
        isLoading={canvas.savingNote}
        disabled={!canvas.canSaveNote}
        onClick={canvas.onSaveNote}
      >
        Save note
      </Button>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        What you save here is used the next time. One email does not become a habit.
      </p>
    </div>
  );
}
