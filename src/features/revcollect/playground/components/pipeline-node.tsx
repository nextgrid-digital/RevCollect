'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { StepStatus } from '../lib/trace-language';

const STATUS_DOT: Record<StepStatus, string> = {
  idle: 'bg-border',
  used: 'bg-primary',
  skipped: 'bg-muted-foreground/40',
  blocked: 'bg-destructive',
  allowed: 'bg-primary'
};

const handleClass = '!bg-background !border-primary !size-3 !border-2';
const sideHandleClass = '!size-2 !border-0 !bg-transparent !opacity-0';

export type PipelineFlowNode = Node<
  { title: string; summary: string; locked: boolean; status: StepStatus },
  'pipeline'
>;

export function PipelineNode({ data, selected }: NodeProps<PipelineFlowNode>) {
  return (
    <article
      className={cn(
        'bg-card relative w-[220px] rounded-2xl border border-border/60',
        selected && 'border-primary ring-primary/30 ring-2',
        data.status === 'skipped' && 'opacity-55',
        data.status === 'blocked' && 'border-destructive'
      )}
    >
      <Handle id='in' type='target' position={Position.Top} className={handleClass} />
      <Handle id='side-in' type='target' position={Position.Left} className={sideHandleClass} />
      <div className='flex items-center gap-2.5 px-3 py-2.5'>
        <span className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-md'>
          <Icons.sparkles className='size-4' />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='flex items-center gap-1'>
            <h2 className='truncate text-sm font-medium'>{data.title}</h2>
            {data.locked ? <Icons.lock className='text-muted-foreground size-3 shrink-0' /> : null}
          </span>
          <p className='text-muted-foreground truncate text-xs'>{data.summary}</p>
        </span>
        <span className={cn('size-2 shrink-0 rounded-full', STATUS_DOT[data.status])} />
      </div>
      <Handle id='down' type='source' position={Position.Bottom} className={handleClass} />
      <Handle
        id='side-out'
        type='source'
        position={Position.Left}
        className={sideHandleClass}
        style={{ top: '72%' }}
      />
    </article>
  );
}

export const pipelineNodeTypes = { pipeline: PipelineNode };
