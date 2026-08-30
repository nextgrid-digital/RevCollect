'use client';

import type { ReactNode } from 'react';
import type { AgentConfig, AgentFollowUpStyle, Customer } from '../../types';
import { Button } from '@/components/ui/button';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { AgentCustomerOverridesSection } from './agent-customer-overrides-section';
import { AgentFollowUpStyleSection } from './agent-follow-up-style-section';
import { AgentJobStory } from './agent-job-story';
import { AgentRiskThresholdsSection } from './agent-risk-thresholds-section';
import { AgentSetupTimeline, type WizardStepId } from './agent-setup-timeline';

interface AgentSetupWizardProps {
  step: WizardStepId;
  draft: AgentConfig;
  isSaving: boolean;
  customersById: Map<string, Customer>;
  availableCustomers: Customer[];
  onStepChange: (step: WizardStepId) => void;
  onFollowUpStyleChange: (style: AgentFollowUpStyle) => void;
  onRiskThresholdsChange: (thresholds: AgentConfig['riskThresholds']) => void;
  onOverrideChange: (customerId: string, style: AgentFollowUpStyle) => void;
  onNoteChange: (customerId: string, note: string) => void;
  onAddOverride: (customerId: string) => void;
  onRemoveOverride: (customerId: string) => void;
  onComplete: () => void;
}

function renderWizardStep(props: AgentSetupWizardProps): ReactNode {
  if (props.step === 1) {
    return <AgentJobStory />;
  }

  if (props.step === 2) {
    return (
      <AgentFollowUpStyleSection
        value={props.draft.followUpStyle}
        onChange={props.onFollowUpStyleChange}
        signature={props.draft.signature}
      />
    );
  }

  if (props.step === 3) {
    return (
      <AgentRiskThresholdsSection
        thresholds={props.draft.riskThresholds}
        onChange={props.onRiskThresholdsChange}
      />
    );
  }

  if (props.step === 4) {
    return (
      <AgentCustomerOverridesSection
        overrides={props.draft.customerOverrides}
        customersById={props.customersById}
        availableCustomers={props.availableCustomers}
        onOverrideChange={props.onOverrideChange}
        onNoteChange={props.onNoteChange}
        onAddOverride={props.onAddOverride}
        onRemoveOverride={props.onRemoveOverride}
      />
    );
  }

  const exhaustive: never = props.step;
  return exhaustive;
}

export function AgentSetupWizard(props: AgentSetupWizardProps) {
  const { step, isSaving, onStepChange, onComplete } = props;
  const isFirstStep = step === 1;
  const isLastStep = step === 4;

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 pb-6'>
      <AgentSetupTimeline currentStep={step} onStepSelect={onStepChange} />

      <WorkspaceCard className='p-4 md:p-5'>{renderWizardStep(props)}</WorkspaceCard>

      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={isFirstStep || isSaving}
          onClick={() => onStepChange((step - 1) as WizardStepId)}
        >
          Back
        </Button>
        {isLastStep ? (
          <Button type='button' size='sm' isLoading={isSaving} onClick={onComplete}>
            Save and turn on
          </Button>
        ) : (
          <Button type='button' size='sm' onClick={() => onStepChange((step + 1) as WizardStepId)}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

export type { WizardStepId };
