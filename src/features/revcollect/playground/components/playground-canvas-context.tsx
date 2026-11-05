'use client';

import { createContext } from 'react';
import type { AgentFollowUpStyle } from '@/features/revcollect/types';
import type { RunReadout, StepId, StepView } from '../lib/trace-language';

export interface PlaygroundCanvasValue {
  steps: Record<StepId, StepView>;
  readout: RunReadout | null;
  instruction: string;
  onInstruction: (value: string) => void;
  followUpStyle: AgentFollowUpStyle;
  onFollowUpStyle: (value: AgentFollowUpStyle) => void;
  onSaveDraftSettings: () => void;
  savingDraftSettings: boolean;
  draftSettingsDisabled: boolean;
  note: string;
  onNote: (value: string) => void;
  onSaveNote: () => void;
  savingNote: boolean;
  canSaveNote: boolean;
}

export const PlaygroundCanvasContext = createContext<PlaygroundCanvasValue | null>(null);
