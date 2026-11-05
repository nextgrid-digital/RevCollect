'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Controls,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useReactFlow,
  type Edge,
  type OnEdgesChange,
  type OnNodesChange
} from '@xyflow/react';
import { useTheme } from 'next-themes';
import '@xyflow/react/dist/style.css';
import type { DecisionTrace } from '@/lib/ari/decision-trace-types';
import { describePipeline, describeRun, type StepId } from '../lib/trace-language';
import { defaultHarnessGraph, type HarnessGraph } from '../lib/harness-graph';
import { PlaygroundCanvasContext, type PlaygroundCanvasValue } from './playground-canvas-context';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NodeInspector } from './node-inspector';
import { pipelineNodeTypes, type PipelineFlowNode } from './pipeline-node';

const FLOW_X = 48;
const FLOW_ROW = 120;
const FLOW_TOP = 24;

function isStepId(id: string): id is StepId {
  return (
    id === 'customer' ||
    id === 'memory' ||
    id === 'decision' ||
    id === 'gemini' ||
    id === 'result' ||
    id === 'learn'
  );
}

function nodesFromGraph(
  graph: HarnessGraph,
  steps: PlaygroundCanvasValue['steps']
): PipelineFlowNode[] {
  return graph.nodes.map((node, index) => ({
    id: node.id,
    type: 'pipeline' as const,
    position: { x: FLOW_X, y: FLOW_TOP + index * FLOW_ROW },
    data: {
      title: node.title,
      summary: node.summary,
      locked: node.locked,
      status: isStepId(node.id) ? steps[node.id].status : 'idle'
    },
    deletable: false,
    connectable: false
  }));
}

function edgesFromGraph(graph: HarnessGraph): Edge[] {
  const order = new Map(graph.nodes.map((node, index) => [node.id, index]));
  return graph.edges.map((edge) => {
    const backward = (order.get(edge.source) ?? 0) > (order.get(edge.target) ?? 0);
    return {
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: backward ? 'side-out' : 'down',
      targetHandle: backward ? 'side-in' : 'in',
      label: backward ? undefined : edge.label,
      labelStyle: { fontSize: 11 },
      type: 'smoothstep' as const,
      deletable: false
    };
  });
}

interface PlaygroundCanvasProps {
  toolbar: ReactNode;
  trace: DecisionTrace | null;
  instruction: string;
  onInstruction: (value: string) => void;
  followUpStyle: PlaygroundCanvasValue['followUpStyle'];
  onFollowUpStyle: PlaygroundCanvasValue['onFollowUpStyle'];
  onSaveDraftSettings: () => void;
  savingDraftSettings: boolean;
  draftSettingsDisabled: boolean;
  note: string;
  onNote: (value: string) => void;
  onSaveNote: () => void;
  savingNote: boolean;
  canSaveNote: boolean;
}

export function PlaygroundCanvas(props: PlaygroundCanvasProps) {
  const { resolvedTheme } = useTheme();
  const [selectedStep, setSelectedStep] = useState<StepId | null>(null);
  const steps = useMemo(
    () => describePipeline(props.trace, props.instruction),
    [props.trace, props.instruction]
  );
  const readout = useMemo(() => describeRun(props.trace), [props.trace]);
  const traceId = props.trace?.id ?? null;
  useEffect(() => {
    setSelectedStep(null);
  }, [traceId]);
  const value = useMemo<PlaygroundCanvasValue>(
    () => ({
      steps,
      readout,
      instruction: props.instruction,
      onInstruction: props.onInstruction,
      followUpStyle: props.followUpStyle,
      onFollowUpStyle: props.onFollowUpStyle,
      onSaveDraftSettings: props.onSaveDraftSettings,
      savingDraftSettings: props.savingDraftSettings,
      draftSettingsDisabled: props.draftSettingsDisabled,
      note: props.note,
      onNote: props.onNote,
      onSaveNote: props.onSaveNote,
      savingNote: props.savingNote,
      canSaveNote: props.canSaveNote
    }),
    [
      steps,
      readout,
      props.instruction,
      props.onInstruction,
      props.followUpStyle,
      props.onFollowUpStyle,
      props.onSaveDraftSettings,
      props.savingDraftSettings,
      props.draftSettingsDisabled,
      props.note,
      props.onNote,
      props.onSaveNote,
      props.savingNote,
      props.canSaveNote
    ]
  );

  const [graph, setGraph] = useState(defaultHarnessGraph);
  const [chat, setChat] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [message, setMessage] = useState('');
  const [architecting, setArchitecting] = useState(false);
  const [architectError, setArchitectError] = useState<string | null>(null);

  async function onArchitect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = message.trim();
    if (!content || architecting) return;
    const nextChat = [...chat, { role: 'user' as const, content }];
    setChat(nextChat);
    setMessage('');
    setArchitecting(true);
    setArchitectError(null);
    try {
      const response = await fetch('/api/revcollect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'architectHarnessFlow',
          payload: { messages: nextChat, graph }
        })
      });
      const body = (await response.json()) as {
        error?: string;
        reply?: string;
        graph?: HarnessGraph;
      };
      if (!response.ok || !body.graph || !body.reply) {
        throw new Error(body.error ?? 'The harness could not update the flow.');
      }
      setGraph(body.graph);
      setChat((current) => [...current, { role: 'assistant', content: body.reply ?? '' }]);
    } catch (error) {
      setArchitectError(
        error instanceof Error ? error.message : 'The harness could not update the flow.'
      );
    } finally {
      setArchitecting(false);
    }
  }

  return (
    <PlaygroundCanvasContext value={value}>
      <div className='flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row'>
        <WorkspaceCard className='flex min-h-[28rem] min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0'>
          <div className='border-b px-4 py-3'>{props.toolbar}</div>
          <div className='min-h-0 flex-1'>
            <FlowSurface
              graph={graph}
              steps={steps}
              colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
              selectedStep={selectedStep}
              onSelect={setSelectedStep}
            />
          </div>
          <form onSubmit={(event) => void onArchitect(event)} className='border-t px-4 py-3'>
            {chat.length > 0 ? (
              <p className='text-muted-foreground mb-2 line-clamp-2 text-xs'>
                {chat[chat.length - 1]?.content}
              </p>
            ) : (
              <p className='text-muted-foreground mb-2 text-xs'>
                Tell the harness what to add. The checks and the human send stay.
              </p>
            )}
            {architectError ? (
              <p className='text-destructive mb-2 text-xs'>{architectError}</p>
            ) : null}
            <div className='flex items-center gap-2'>
              <label htmlFor='harness-chat' className='sr-only'>
                Message the harness
              </label>
              <Input
                id='harness-chat'
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder='Add a books specialist before the draft'
                disabled={architecting}
              />
              <Button type='submit' size='sm' isLoading={architecting} disabled={!message.trim()}>
                Send
              </Button>
            </div>
          </form>
        </WorkspaceCard>
        <WorkspaceCard className='flex w-full shrink-0 flex-col overflow-hidden lg:w-[24rem]'>
          <NodeInspector stepId={selectedStep} onClose={() => setSelectedStep(null)} />
        </WorkspaceCard>
      </div>
    </PlaygroundCanvasContext>
  );
}

function FitOnChange({ token }: { token: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void fitView({ padding: 0.35, duration: 200 });
    });
    return () => cancelAnimationFrame(frame);
  }, [token, fitView]);
  return null;
}

function FlowSurface({
  graph,
  steps,
  colorMode,
  selectedStep,
  onSelect
}: {
  graph: HarnessGraph;
  steps: PlaygroundCanvasValue['steps'];
  colorMode: 'light' | 'dark';
  selectedStep: StepId | null;
  onSelect: (stepId: StepId) => void;
}) {
  const laidOut = useMemo(() => nodesFromGraph(graph, steps), [graph, steps]);
  const laidEdges = useMemo(() => edgesFromGraph(graph), [graph]);
  const [nodes, setNodes] = useState(laidOut);
  const [edges, setEdges] = useEdgesState(laidEdges);
  const graphToken = graph.nodes.map((node) => node.id).join('|');
  useEffect(() => {
    setNodes(nodesFromGraph(graph, steps));
    setEdges(edgesFromGraph(graph));
  }, [graph, steps, setEdges]);
  const shownNodes = useMemo(
    () => nodes.map((node) => ({ ...node, selected: node.id === selectedStep })),
    [nodes, selectedStep]
  );
  const onNodesChange = useCallback<OnNodesChange<PipelineFlowNode>>((changes) => {
    setNodes((current) =>
      applyNodeChanges(
        changes.filter((change) => change.type !== 'remove'),
        current
      )
    );
  }, []);
  const onEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      setEdges((current) =>
        applyEdgeChanges(
          changes.filter((change) => change.type !== 'remove'),
          current
        )
      );
    },
    [setEdges]
  );

  return (
    <div className='bg-background h-full w-full'>
      <ReactFlow
        nodes={shownNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_event, node) => {
          if (isStepId(node.id)) onSelect(node.id);
        }}
        nodeTypes={pipelineNodeTypes}
        colorMode={colorMode}
        fitView
        fitViewOptions={{ padding: 0.35, minZoom: 0.55, maxZoom: 1 }}
        nodesConnectable={false}
        edgesReconnectable={false}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.5}
      >
        <FitOnChange token={graphToken} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
