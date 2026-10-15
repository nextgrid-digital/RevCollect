import type {
  AgentAddonStatus,
  AgentConfig,
  Customer,
  Invoice,
  RelationshipPolicy,
  ThreadEmail
} from '@/features/revcollect/types';
import { DEFAULT_ADDON_STATUS, emptyIntelligence, emptySnapshot } from './defaults';
import { normalizeRelationshipState } from '@/features/revcollect/lib/relationship-policy';
import { buildSyntheticInboxFromInvoices } from '@/features/revcollect/api/xero-map';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid, ledgerEntityUuid } from './ledger-entity-id';
import { toPaymentRows } from './postgres-payments';
import type {
  AgentDraftRecord,
  CanonicalSnapshot,
  CanonicalStore,
  AriRunRecord,
  CustomerIntelligence
} from './types';

interface CustomerRow {
  id: string;
  external_id: string | null;
  name: string;
  email: string;
  company: string;
  phone: string | null;
  avatar_url: string | null;
  status: Customer['status'];
  balance_cents: number;
  days_overdue: number;
  promised_date?: string | null;
  relationship_state: string;
  relationship_policy?: RelationshipPolicy | Record<string, never> | null;
  intelligence: CustomerIntelligence | Record<string, never>;
}

interface InvoiceRow {
  id: string;
  customer_id: string;
  external_id: string | null;
  number: string;
  amount_cents: number;
  due_date: string;
  status: Invoice['status'];
  aging_bucket: Invoice['agingBucket'];
  issue_date: string | null;
  paid_cents: number;
  xero_status: string | null;
  amount_due_cents: number | null;
  paid_at: string | null;
}

interface PaymentRow {
  id: string;
  customer_id: string;
  invoice_id: string | null;
  amount_cents: number;
  paid_at: string;
  external_id: string | null;
}

interface DraftRow {
  id: string;
  thread_id: string;
  customer_id: string | null;
  title: string;
  body_text: string | null;
  tone: string;
  prepared_at: string;
}

interface AriRow {
  id: string;
  ran_at: string;
  hour_label: string;
  bullets: string[];
}

interface TenantRow {
  last_synced_at?: string | null;
  sent_emails?: ThreadEmail[];
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  agent_addon_subscribed?: boolean | null;
  base_subscribed?: boolean | null;
  trial_started_at?: string | null;
  subscription_status?: string | null;
}

function addonStatusFromTenant(row: TenantRow | null): AgentAddonStatus | null {
  if (!row) return null;
  const subscribed = Boolean(row.agent_addon_subscribed);
  const customerId = row.stripe_customer_id ?? null;
  if (!subscribed && !customerId && !row.base_subscribed && !row.trial_started_at) return null;
  return {
    ...DEFAULT_ADDON_STATUS,
    subscribed,
    stripeCustomerId: customerId
  };
}

function intelligenceFromRow(row: CustomerRow): CustomerIntelligence {
  const stored = row.intelligence ?? {};
  const policy = (
    row.relationship_policy && Object.keys(row.relationship_policy).length > 0
      ? row.relationship_policy
      : stored.relationshipPolicy
  ) as RelationshipPolicy | undefined;
  return {
    ...emptyIntelligence(),
    ...stored,
    relationshipState: normalizeRelationshipState(
      row.relationship_state ?? stored.relationshipState ?? 'normal'
    ),
    relationshipPolicy: policy,
    patterns: { ...emptyIntelligence().patterns, ...stored.patterns },
    situations: stored.situations ?? [],
    preferences: stored.preferences ?? {},
    installmentHistory: stored.installmentHistory ?? []
  };
}

function mapCustomer(row: CustomerRow): Customer {
  const intelligence = intelligenceFromRow(row);
  const externalId = row.external_id && row.external_id !== row.id ? row.external_id : undefined;
  return {
    id: row.id,
    externalId,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    company: row.company,
    avatarUrl: row.avatar_url ?? undefined,
    status: row.status,
    balanceCents: row.balance_cents,
    daysOverdue: row.days_overdue,
    promisedDate: row.promised_date?.slice(0, 10) || undefined,
    classifiedReplyId: intelligence.classifiedReplyId,
    relationshipState: intelligence.relationshipState,
    relationshipPolicy: intelligence.relationshipPolicy
  };
}

function mapInvoice(row: InvoiceRow): Invoice {
  const externalId = row.external_id && row.external_id !== row.id ? row.external_id : undefined;
  return {
    id: row.id,
    externalId,
    customerId: row.customer_id,
    number: row.number,
    amountCents: row.amount_cents,
    dueDate: row.due_date,
    status: row.status,
    agingBucket: row.aging_bucket,
    issueDate: row.issue_date ?? undefined,
    paidCents: row.paid_cents,
    xeroStatus: row.xero_status ?? undefined,
    amountDueCents: row.amount_due_cents ?? undefined,
    paidAt: row.paid_at ?? undefined
  };
}

async function ensureTenant(tenantId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('tenants').upsert(
    {
      id: tenantId,
      owner_user_id: tenantId,
      supabase_user_id: tenantId,
      name: 'Workspace',
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );
  if (error) {
    throw new Error(`Failed to ensure tenant: ${error.message}`);
  }
}

async function readSnapshot(tenantId: string): Promise<CanonicalSnapshot> {
  const supabase = createAdminClient();
  const [customersRes, invoicesRes, paymentsRes, draftsRes, ariRes, configRes, tenantRes] =
    await Promise.all([
      supabase.from('customers').select('*').eq('tenant_id', tenantId).is('deleted_at', null),
      supabase.from('invoices').select('*').eq('tenant_id', tenantId).is('deleted_at', null),
      supabase.from('payments').select('*').eq('tenant_id', tenantId),
      supabase.from('agent_drafts').select('*').eq('tenant_id', tenantId),
      supabase
        .from('ari_runs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('ran_at', { ascending: false }),
      supabase.from('agent_config').select('*').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('tenants').select('*').eq('id', tenantId).maybeSingle()
    ]);

  const firstError =
    customersRes.error ??
    invoicesRes.error ??
    paymentsRes.error ??
    draftsRes.error ??
    configRes.error;
  if (firstError) {
    throw new Error(`Canonical postgres read failed: ${firstError.message}`);
  }

  const customerRows = (customersRes.data ?? []) as CustomerRow[];
  const intelligenceByCustomerId: Record<string, CustomerIntelligence> = {};
  for (const row of customerRows) {
    intelligenceByCustomerId[row.id] = intelligenceFromRow(row);
  }

  const configRow = configRes.data as { config?: AgentConfig; is_active?: boolean } | null;
  const customers = customerRows.map(mapCustomer);
  const invoices = ((invoicesRes.data ?? []) as InvoiceRow[]).map(mapInvoice);

  return {
    ...emptySnapshot(),
    customers,
    invoices,
    payments: ((paymentsRes.data ?? []) as PaymentRow[]).map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      invoiceId: row.invoice_id ?? undefined,
      amountCents: row.amount_cents,
      paidAt: row.paid_at,
      externalId: row.external_id ?? undefined
    })),
    intelligenceByCustomerId,
    drafts: ((draftsRes.data ?? []) as DraftRow[]).map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      customerId: row.customer_id ?? '',
      title: row.title,
      body: row.body_text ?? '',
      tone: row.tone,
      preparedAt: row.prepared_at
    })),
    inboxMessages: buildSyntheticInboxFromInvoices(invoices, customers),
    agentConfig: configRow?.config ?? null,
    ariRuns: ariRes.error
      ? []
      : ((ariRes.data ?? []) as AriRow[]).map((row) => ({
          id: row.id,
          ranAt: row.ran_at,
          hourLabel: row.hour_label,
          bullets: Array.isArray(row.bullets) ? row.bullets : []
        })),
    ingestedAt: tenantRes.error
      ? null
      : ((tenantRes.data as TenantRow | null)?.last_synced_at ?? null),
    sentEmails: tenantRes.error
      ? []
      : Array.isArray((tenantRes.data as TenantRow | null)?.sent_emails)
        ? ((tenantRes.data as TenantRow).sent_emails ?? [])
        : [],
    stripeCustomerId: tenantRes.error
      ? null
      : ((tenantRes.data as TenantRow | null)?.stripe_customer_id ?? null),
    stripeSubscriptionId: tenantRes.error
      ? null
      : ((tenantRes.data as TenantRow | null)?.stripe_subscription_id ?? null),
    trialStartedAt: tenantRes.error
      ? null
      : ((tenantRes.data as TenantRow | null)?.trial_started_at ?? null),
    baseSubscribed: tenantRes.error
      ? false
      : Boolean((tenantRes.data as TenantRow | null)?.base_subscribed),
    agentAddonStatus: tenantRes.error
      ? null
      : addonStatusFromTenant(tenantRes.data as TenantRow | null)
  };
}

async function writeSnapshot(tenantId: string, snapshot: CanonicalSnapshot): Promise<void> {
  await ensureTenant(tenantId);
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  if (snapshot.customers.length > 0) {
    const { error } = await supabase.from('customers').upsert(
      snapshot.customers.map((customer) => {
        const intelligence = snapshot.intelligenceByCustomerId[customer.id] ?? emptyIntelligence();
        const id = isUuid(customer.id)
          ? customer.id
          : ledgerEntityUuid(tenantId, 'customer', customer.externalId ?? customer.id);
        return {
          id,
          tenant_id: tenantId,
          external_id: customer.externalId ?? customer.id,
          name: customer.name,
          email: customer.email,
          company: customer.company,
          phone: customer.phone ?? null,
          avatar_url: customer.avatarUrl ?? null,
          status: customer.status,
          balance_cents: customer.balanceCents,
          days_overdue: customer.daysOverdue,
          promised_date: customer.promisedDate?.slice(0, 10) ?? null,
          relationship_state: customer.relationshipState ?? intelligence.relationshipState,
          relationship_policy: customer.relationshipPolicy ?? intelligence.relationshipPolicy ?? {},
          follow_up_state: (snapshot.sentEmails ?? []).some(
            (email) =>
              email.customerId === customer.id ||
              email.customerId === id ||
              email.threadId === `xero-customer-${customer.id}` ||
              email.threadId === `xero-customer-${id}`
          )
            ? 'sent'
            : 'idle',
          intelligence: {
            ...intelligence,
            classifiedReplyId: customer.classifiedReplyId,
            relationshipState: customer.relationshipState ?? intelligence.relationshipState,
            relationshipPolicy: customer.relationshipPolicy ?? intelligence.relationshipPolicy
          }
        };
      }),
      { onConflict: 'id' }
    );
    if (error) throw new Error(`Failed to upsert customers: ${error.message}`);
  }

  if (snapshot.invoices.length > 0) {
    const { error } = await supabase.from('invoices').upsert(
      snapshot.invoices.map((invoice) => {
        const id = isUuid(invoice.id)
          ? invoice.id
          : ledgerEntityUuid(tenantId, 'invoice', invoice.externalId ?? invoice.id);
        const customerId = isUuid(invoice.customerId)
          ? invoice.customerId
          : ledgerEntityUuid(tenantId, 'customer', invoice.customerId);
        return {
          id,
          tenant_id: tenantId,
          customer_id: customerId,
          external_id: invoice.externalId ?? invoice.id,
          number: invoice.number,
          amount_cents: invoice.amountCents,
          due_date: invoice.dueDate,
          status: invoice.status,
          aging_bucket: invoice.agingBucket,
          issue_date: invoice.issueDate ?? null,
          paid_cents: invoice.paidCents ?? 0,
          xero_status: invoice.xeroStatus ?? null,
          amount_due_cents: invoice.amountDueCents ?? invoice.amountCents,
          paid_at: invoice.paidAt ?? null
        };
      }),
      { onConflict: 'id' }
    );
    if (error) throw new Error(`Failed to upsert invoices: ${error.message}`);
  }

  const invoiceIds = new Set(
    snapshot.invoices.map((invoice) =>
      isUuid(invoice.id)
        ? invoice.id
        : ledgerEntityUuid(tenantId, 'invoice', invoice.externalId ?? invoice.id)
    )
  );
  const paymentRows = toPaymentRows(tenantId, snapshot.payments, invoiceIds);
  if (paymentRows.length > 0) {
    const { error } = await supabase
      .from('payments')
      .upsert(paymentRows, { onConflict: 'tenant_id,external_id' });
    if (error) throw new Error(`Failed to upsert payments: ${error.message}`);
  }

  if (snapshot.inboxMessages.length > 0) {
    const { error } = await supabase.from('inbox_threads').upsert(
      snapshot.inboxMessages.map((message) => {
        const id = isUuid(message.id)
          ? message.id
          : ledgerEntityUuid(tenantId, 'inbox', message.id);
        const customerId = isUuid(message.customerId)
          ? message.customerId
          : ledgerEntityUuid(tenantId, 'customer', message.customerId);
        return {
          id,
          tenant_id: tenantId,
          customer_id: customerId,
          subject: message.subject,
          preview: message.preview,
          received_at: message.receivedAt,
          unread: message.unread,
          channel: message.channel,
          reply_intent: message.replyIntent ?? null,
          reply_intent_label: message.replyIntentLabel ?? null,
          agent_draft_ready: Boolean(message.agentDraftReady),
          suggested_action: message.suggestedAction ?? null
        };
      }),
      { onConflict: 'id' }
    );
    if (error) throw new Error(`Failed to upsert inbox threads: ${error.message}`);
  }

  if (snapshot.drafts.length > 0) {
    const { error } = await supabase.from('agent_drafts').upsert(
      snapshot.drafts.map((draft) => {
        const id = isUuid(draft.id) ? draft.id : ledgerEntityUuid(tenantId, 'draft', draft.id);
        const threadId = isUuid(draft.threadId)
          ? draft.threadId
          : ledgerEntityUuid(tenantId, 'inbox', draft.threadId);
        const customerId = draft.customerId
          ? isUuid(draft.customerId)
            ? draft.customerId
            : ledgerEntityUuid(tenantId, 'customer', draft.customerId)
          : null;
        return {
          id,
          tenant_id: tenantId,
          thread_id: threadId,
          customer_id: customerId,
          title: draft.title,
          body_text: draft.body,
          tone: draft.tone,
          prepared_at: draft.preparedAt
        };
      }),
      { onConflict: 'id' }
    );
    if (error) throw new Error(`Failed to upsert drafts: ${error.message}`);
  }

  if (snapshot.ariRuns.length > 0) {
    const { error } = await supabase.from('ari_runs').upsert(
      snapshot.ariRuns.map((run) => ({
        id: run.id,
        tenant_id: tenantId,
        ran_at: run.ranAt,
        hour_label: run.hourLabel,
        bullets: run.bullets
      })),
      { onConflict: 'id' }
    );
    if (error) {
      console.error('[canonical] skipped ARI run upsert:', error.message);
    }
  }

  if (snapshot.ingestedAt) {
    const { error } = await supabase
      .from('tenants')
      .update({ last_synced_at: snapshot.ingestedAt, updated_at: now })
      .eq('id', tenantId);
    if (error) {
      console.error('[canonical] skipped last_synced_at update:', error.message);
    }
  }

  if (snapshot.sentEmails) {
    const { error } = await supabase
      .from('tenants')
      .update({ sent_emails: snapshot.sentEmails, updated_at: now })
      .eq('id', tenantId);
    if (error) {
      console.error('[canonical] skipped sent_emails update:', error.message);
    }
  }

  const billingUpdate: Record<string, unknown> = { updated_at: now };
  if (snapshot.stripeCustomerId !== undefined) {
    billingUpdate.stripe_customer_id = snapshot.stripeCustomerId;
  }
  if (snapshot.stripeSubscriptionId !== undefined) {
    billingUpdate.stripe_subscription_id = snapshot.stripeSubscriptionId;
  }
  if (snapshot.trialStartedAt) {
    billingUpdate.trial_started_at = snapshot.trialStartedAt;
  }
  billingUpdate.base_subscribed = Boolean(snapshot.baseSubscribed);
  if (snapshot.agentAddonStatus) {
    billingUpdate.agent_addon_subscribed = snapshot.agentAddonStatus.subscribed;
    billingUpdate.subscription_status = snapshot.baseSubscribed
      ? 'active'
      : snapshot.agentAddonStatus.subscribed
        ? 'active'
        : 'cancelled';
  }
  const { error: billingError } = await supabase
    .from('tenants')
    .update(billingUpdate)
    .eq('id', tenantId);
  if (billingError) {
    throw new Error(`[canonical] stripe billing update failed: ${billingError.message}`);
  }

  if (snapshot.agentConfig) {
    const { error } = await supabase.from('agent_config').upsert(
      {
        tenant_id: tenantId,
        config: snapshot.agentConfig,
        is_active: snapshot.agentConfig.isActive,
        tone: snapshot.agentConfig.tone,
        auto_send_enabled: false,
        escalation_rules: snapshot.agentConfig.escalationRules,
        signature: snapshot.agentConfig.signature,
        updated_at: now
      },
      { onConflict: 'tenant_id' }
    );
    if (error) throw new Error(`Failed to upsert agent config: ${error.message}`);
  }
}

export async function postgresStoreAvailable(): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('customers').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export const postgresCanonicalStore: CanonicalStore = {
  read(tenantId) {
    return readSnapshot(tenantId);
  },
  write(tenantId, snapshot) {
    return writeSnapshot(tenantId, snapshot);
  },
  async replaceAr(tenantId, payload) {
    const current = await readSnapshot(tenantId);
    const next: CanonicalSnapshot = {
      ...current,
      customers: payload.customers,
      invoices: payload.invoices,
      payments: payload.payments,
      inboxMessages: payload.inboxMessages,
      ingestedAt: new Date().toISOString()
    };
    await writeSnapshot(tenantId, next);
    return next;
  }
};

export type { AgentDraftRecord, AriRunRecord };
