import { NextResponse } from 'next/server';
import { getCanonicalStore } from '@/lib/canonical/store';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import { getAuthUser } from '@/lib/supabase/get-auth-user';
import type { AgentAddonStatus } from '@/features/revcollect/types';
import { emailForUserId, isCompedEmail } from './comped';
import { AGENT_PRICE_MONTHLY_CENTS, BASE_PRICE_MONTHLY_CENTS, TRIAL_DAYS } from './pricing';

export class ReadOnlyError extends Error {
  readonly code = 'read_only' as const;
  readonly checkoutPath = '/settings/billing';

  constructor() {
    super('This workspace is read-only until you subscribe.');
    this.name = 'ReadOnlyError';
  }
}

export class AgentBillingRequiredError extends Error {
  readonly code = 'agent_billing_required' as const;
  readonly checkoutPath = '/settings/billing?addon=agent';

  constructor() {
    super('Collections Agent requires an active add-on.');
    this.name = 'AgentBillingRequiredError';
  }
}

export interface WorkspaceEntitlements {
  inTrial: boolean;
  trialEndsAt: string | null;
  daysLeft: number;
  hasBase: boolean;
  hasAgent: boolean;
  canWrite: boolean;
  canRunAgent: boolean;
  stripeCustomerId: string | null;
  baseSubscribed: boolean;
  agentSubscribed: boolean;
  comped: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addDays(iso: string, days: number): Date {
  return new Date(new Date(iso).getTime() + days * MS_PER_DAY);
}

export function entitlementsFromSnapshot(input: {
  trialStartedAt: string | null;
  baseSubscribed: boolean;
  agentSubscribed: boolean;
  stripeCustomerId: string | null;
  comped?: boolean;
  now?: Date;
}): WorkspaceEntitlements {
  if (input.comped) {
    return {
      inTrial: false,
      trialEndsAt: null,
      daysLeft: 0,
      hasBase: true,
      hasAgent: true,
      canWrite: true,
      canRunAgent: true,
      stripeCustomerId: input.stripeCustomerId,
      baseSubscribed: true,
      agentSubscribed: true,
      comped: true
    };
  }

  const now = input.now ?? new Date();
  const trialStartedAt = input.trialStartedAt;
  const trialEndsAt = trialStartedAt ? addDays(trialStartedAt, TRIAL_DAYS) : null;
  const inTrial = Boolean(trialEndsAt && now.getTime() < trialEndsAt.getTime());
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / MS_PER_DAY))
    : 0;
  const hasBase = inTrial || input.baseSubscribed;
  const hasAgent = inTrial || (input.baseSubscribed && input.agentSubscribed);

  return {
    inTrial,
    trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
    daysLeft: inTrial ? daysLeft : 0,
    hasBase,
    hasAgent,
    canWrite: hasBase,
    canRunAgent: hasAgent,
    stripeCustomerId: input.stripeCustomerId,
    baseSubscribed: input.baseSubscribed,
    agentSubscribed: input.agentSubscribed,
    comped: false
  };
}

export function addonStatusFromEntitlements(entitlements: WorkspaceEntitlements): AgentAddonStatus {
  return {
    subscribed: entitlements.canRunAgent,
    priceMonthlyCents: AGENT_PRICE_MONTHLY_CENTS,
    stripeCustomerId: entitlements.stripeCustomerId,
    hasBase: entitlements.hasBase,
    inTrial: entitlements.inTrial,
    trialEndsAt: entitlements.trialEndsAt,
    daysLeft: entitlements.daysLeft,
    canWrite: entitlements.canWrite,
    canRunAgent: entitlements.canRunAgent,
    basePriceMonthlyCents: BASE_PRICE_MONTHLY_CENTS,
    baseSubscribed: entitlements.baseSubscribed,
    comped: entitlements.comped
  };
}

export async function getWorkspaceEntitlementsForTenant(
  tenantId: string,
  options?: { email?: string | null }
): Promise<WorkspaceEntitlements> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  let trialStartedAt = snapshot.trialStartedAt;
  if (!trialStartedAt) {
    trialStartedAt = new Date().toISOString();
    snapshot.trialStartedAt = trialStartedAt;
    await store.write(tenantId, snapshot);
  }

  const email = options?.email ?? (await emailForUserId(tenantId));

  return entitlementsFromSnapshot({
    trialStartedAt,
    baseSubscribed: Boolean(snapshot.baseSubscribed),
    agentSubscribed: Boolean(snapshot.agentAddonStatus?.subscribed),
    stripeCustomerId: snapshot.stripeCustomerId,
    comped: isCompedEmail(email)
  });
}

export async function getWorkspaceEntitlements(): Promise<WorkspaceEntitlements> {
  const [tenantId, user] = await Promise.all([getIntegrationTenantId(), getAuthUser()]);
  return getWorkspaceEntitlementsForTenant(tenantId, { email: user.email });
}

export async function getAgentAddonBillingStatus(): Promise<AgentAddonStatus> {
  return addonStatusFromEntitlements(await getWorkspaceEntitlements());
}

export async function assertCanWrite(): Promise<WorkspaceEntitlements> {
  const entitlements = await getWorkspaceEntitlements();
  if (!entitlements.canWrite) {
    throw new ReadOnlyError();
  }
  return entitlements;
}

export async function assertCanRunAgent(): Promise<WorkspaceEntitlements> {
  const entitlements = await getWorkspaceEntitlements();
  if (!entitlements.canRunAgent) {
    throw new AgentBillingRequiredError();
  }
  return entitlements;
}

export function billingErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof ReadOnlyError || error instanceof AgentBillingRequiredError) {
    return NextResponse.json(
      { error: error.code, checkoutPath: error.checkoutPath, message: error.message },
      { status: 402 }
    );
  }
  return null;
}
