'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useActivateAgent,
  useAgentAddonStatus,
  useAgentConfig,
  useCustomers,
  useUpdateAgentConfig
} from '../../api/queries';
import type { AgentConfig, AgentFollowUpStyle } from '../../types';
import { followUpStyleToTone } from '../lib/follow-up-style';
import { AgentBehaviorsSection } from './agent-behaviors-section';
import { AgentCustomerOverridesSection } from './agent-customer-overrides-section';
import { AgentDigestPreviewSection } from './agent-digest-preview-section';
import { AgentEscalationRulesSection } from './agent-escalation-rules-section';
import { AgentFollowUpStyleSection } from './agent-follow-up-style-section';
import { AgentHowItWorks } from './agent-how-it-works';
import { AgentPageFooter } from './agent-page-footer';
import { AgentPageIntro } from './agent-page-intro';
import { AgentRiskThresholdsSection } from './agent-risk-thresholds-section';
import { AgentSignatureSection } from './agent-signature-section';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { MotionStagger, MotionStaggerItem } from '@/features/revcollect/motion/motion-primitives';

function normalizeAgentConfig(config: AgentConfig): AgentConfig {
  return {
    ...config,
    behaviors: {
      ...config.behaviors,
      digestHour: config.behaviors.digestHour ?? 7
    }
  };
}

function agentConfigsEqual(a: AgentConfig, b: AgentConfig): boolean {
  return JSON.stringify(normalizeAgentConfig(a)) === JSON.stringify(normalizeAgentConfig(b));
}

export function AgentPage() {
  const router = useRouter();
  const { data: savedConfig, isPending: configLoading } = useAgentConfig();
  const { data: addonStatus, isPending: addonLoading } = useAgentAddonStatus();
  const { data: customers = [] } = useCustomers();
  const updateConfig = useUpdateAgentConfig();
  const activateAgent = useActivateAgent();

  const [draft, setDraft] = useState<AgentConfig | null>(null);

  useEffect(() => {
    if (savedConfig) {
      setDraft(normalizeAgentConfig(savedConfig));
    }
  }, [savedConfig]);

  const customersById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers]
  );

  const overrideCustomerIds = useMemo(
    () => new Set(draft?.customerOverrides.map((override) => override.customerId) ?? []),
    [draft?.customerOverrides]
  );

  const availableCustomers = useMemo(
    () => customers.filter((customer) => !overrideCustomerIds.has(customer.id)),
    [customers, overrideCustomerIds]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !savedConfig) return false;
    return !agentConfigsEqual(draft, savedConfig);
  }, [draft, savedConfig]);

  const persistDraft = useCallback(
    async (config: AgentConfig) => {
      const saved = await updateConfig.mutateAsync(config);
      setDraft(normalizeAgentConfig(saved));
      return saved;
    },
    [updateConfig]
  );

  const handleFollowUpStyleChange = useCallback((style: AgentFollowUpStyle) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            followUpStyle: style,
            tone: followUpStyleToTone(style)
          }
        : prev
    );
  }, []);

  const handleOverrideChange = useCallback((customerId: string, style: AgentFollowUpStyle) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            customerOverrides: prev.customerOverrides.map((override) =>
              override.customerId === customerId ? { ...override, style } : override
            )
          }
        : prev
    );
  }, []);

  const handleNoteChange = useCallback((customerId: string, note: string) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            customerOverrides: prev.customerOverrides.map((override) =>
              override.customerId === customerId ? { ...override, note } : override
            )
          }
        : prev
    );
  }, []);

  const handleAddOverride = useCallback((customerId: string) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            customerOverrides: [
              ...prev.customerOverrides,
              {
                customerId,
                style: 'balanced',
                note: ''
              }
            ]
          }
        : prev
    );
  }, []);

  const handleRemoveOverride = useCallback((customerId: string) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            customerOverrides: prev.customerOverrides.filter(
              (override) => override.customerId !== customerId
            )
          }
        : prev
    );
  }, []);

  const handlePreview = useCallback(() => {
    router.push('/inbox?filter=drafts');
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!draft) return;

    try {
      await persistDraft(draft);
      toast.success('Agent settings saved');
    } catch {
      toast.error('Could not save agent settings');
    }
  }, [draft, persistDraft]);

  const handleActivate = useCallback(async () => {
    if (!draft || !addonStatus) return;

    if (!addonStatus.subscribed) {
      toast.message('Subscribe to the Collections Agent add-on to activate');
      router.push('/settings/billing?addon=agent');
      return;
    }

    try {
      await persistDraft(draft);
      const result = await activateAgent.mutateAsync();
      if (result.needsBilling) {
        toast.message('Subscribe to the Collections Agent add-on to activate');
        router.push('/settings/billing?addon=agent');
        return;
      }
      setDraft((prev) => (prev ? { ...prev, isActive: true } : prev));
      toast.success('Agent activated');
    } catch {
      toast.error('Could not activate agent');
    }
  }, [activateAgent, addonStatus, draft, persistDraft, router]);

  const handleActiveChange = useCallback(
    async (nextActive: boolean) => {
      if (!draft || !addonStatus) return;

      if (nextActive && !addonStatus.subscribed) {
        toast.message('Subscribe to the Collections Agent add-on to activate');
        router.push('/settings/billing?addon=agent');
        return;
      }

      const nextDraft = { ...draft, isActive: nextActive };
      setDraft(nextDraft);

      if (addonStatus.subscribed) {
        try {
          if (nextActive) {
            await persistDraft(nextDraft);
            await activateAgent.mutateAsync();
          } else {
            await persistDraft(nextDraft);
          }
          toast.success(nextActive ? 'Agent enabled' : 'Agent paused');
        } catch {
          toast.error('Could not update agent status');
          setDraft(draft);
        }
      }
    },
    [activateAgent, addonStatus, draft, persistDraft, router]
  );

  if (configLoading || addonLoading || !draft || !addonStatus) {
    return <p className='text-muted-foreground text-sm'>Loading agent configuration…</p>;
  }

  const isSaving = updateConfig.isPending || activateAgent.isPending;

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle title='Agent' className='shrink-0' />
      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 pb-6'>
          <WorkspaceCard className='p-4 md:p-5'>
            <AgentPageIntro
              isActive={draft.isActive}
              priceMonthlyCents={addonStatus.priceMonthlyCents}
              onActiveChange={handleActiveChange}
            />
          </WorkspaceCard>

          <WorkspaceCard className='p-4 md:p-5'>
            <AgentHowItWorks />
          </WorkspaceCard>

          <MotionStagger className='space-y-4'>
            <MotionStaggerItem index={0}>
              <WorkspaceCard className='p-4 md:p-5'>
                <AgentFollowUpStyleSection
                  value={draft.followUpStyle}
                  onChange={handleFollowUpStyleChange}
                />
              </WorkspaceCard>
            </MotionStaggerItem>
            <MotionStaggerItem index={1}>
              <WorkspaceCard className='p-4 md:p-5'>
                <AgentRiskThresholdsSection
                  thresholds={draft.riskThresholds}
                  onChange={(riskThresholds) =>
                    setDraft((prev) => (prev ? { ...prev, riskThresholds } : prev))
                  }
                />
              </WorkspaceCard>
            </MotionStaggerItem>
            <MotionStaggerItem index={2}>
              <WorkspaceCard className='p-4 md:p-5'>
                <AgentCustomerOverridesSection
                  overrides={draft.customerOverrides}
                  customersById={customersById}
                  availableCustomers={availableCustomers}
                  onOverrideChange={handleOverrideChange}
                  onNoteChange={handleNoteChange}
                  onAddOverride={handleAddOverride}
                  onRemoveOverride={handleRemoveOverride}
                />
              </WorkspaceCard>
            </MotionStaggerItem>
            <MotionStaggerItem index={3}>
              <WorkspaceCard className='p-4 md:p-5'>
                <AgentBehaviorsSection
                  behaviors={draft.behaviors}
                  onChange={(behaviors) =>
                    setDraft((prev) => (prev ? { ...prev, behaviors } : prev))
                  }
                />
              </WorkspaceCard>
            </MotionStaggerItem>
            <MotionStaggerItem index={4}>
              <WorkspaceCard className='p-4 md:p-5'>
                <AgentEscalationRulesSection
                  value={draft.escalationRules}
                  onChange={(escalationRules) =>
                    setDraft((prev) => (prev ? { ...prev, escalationRules } : prev))
                  }
                />
              </WorkspaceCard>
            </MotionStaggerItem>
            <MotionStaggerItem index={5}>
              <WorkspaceCard className='p-4 md:p-5'>
                <AgentSignatureSection
                  value={draft.signature}
                  onChange={(signature) =>
                    setDraft((prev) => (prev ? { ...prev, signature } : prev))
                  }
                />
              </WorkspaceCard>
            </MotionStaggerItem>
            <MotionStaggerItem index={6}>
              <WorkspaceCard className='p-4 md:p-5'>
                <AgentDigestPreviewSection
                  digest={draft.digestPreview}
                  digestHour={draft.behaviors.digestHour}
                  riskThresholds={draft.riskThresholds}
                />
              </WorkspaceCard>
            </MotionStaggerItem>
          </MotionStagger>

          <AgentPageFooter
            priceMonthlyCents={addonStatus.priceMonthlyCents}
            estimatedAiCostMonthlyCents={addonStatus.estimatedAiCostMonthlyCents}
            subscribed={addonStatus.subscribed}
            isActive={draft.isActive}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            onPreview={handlePreview}
            onSave={handleSave}
            onActivate={handleActivate}
          />
        </div>
      </div>
    </WorkspaceCanvas>
  );
}
