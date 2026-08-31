import type { AgentConfig, Customer, Invoice, ThreadEmail } from '@/features/revcollect/types';
import { buildSyntheticInboxFromInvoices } from '@/features/revcollect/api/xero-map';
import { createAdminClient } from '@/lib/supabase/admin';
import { emptyIntelligence, emptySnapshot } from './defaults';
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
  relationship_state: CustomerIntelligence['relationshipState'];
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

function intelligenceFromRow(row: CustomerRow): CustomerIntelligence {
  const stored = row.intelligence ?? {};
  return {
    ...emptyIntelligence(),
    ...stored,
    relationshipState: row.relationship_state ?? stored.relationshipState ?? 'normal',
    patterns: { ...emptyIntelligence().patterns, ...stored.patterns },
    situations: stored.situations ?? [],
    preferences: stored.preferences ?? {},
    installmentHistory: stored.installmentHistory ?? []
  };
}

function mapCustomer(row: CustomerRow): Customer {
  const intelligence = intelligenceFromRow(row);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    company: row.company,
    avatarUrl: row.avatar_url ?? undefined,
    status: row.status,
    balanceCents: row.balance_cents,
    daysOverdue: row.days_overdue,
    relationshipState: intelligence.relationshipState
  };
}

function mapInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
      : ((tenantRes.data as { last_synced_at?: string | null } | null)?.last_synced_at ?? null),
    sentEmails: tenantRes.error
      ? []
      : Array.isArray((tenantRes.data as { sent_emails?: ThreadEmail[] } | null)?.sent_emails)
        ? (tenantRes.data as { sent_emails: ThreadEmail[] }).sent_emails
        : []
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
        return {
          id: customer.id,
          tenant_id: tenantId,
          external_id: customer.id,
          name: customer.name,
          email: customer.email,
          company: customer.company,
          phone: customer.phone ?? null,
          avatar_url: customer.avatarUrl ?? null,
          status: customer.status,
          balance_cents: customer.balanceCents,
          days_overdue: customer.daysOverdue,
          relationship_state: customer.relationshipState ?? intelligence.relationshipState,
          follow_up_state: (snapshot.sentEmails ?? []).some(
            (email) =>
              email.customerId === customer.id || email.threadId === `xero-customer-${customer.id}`
          )
            ? 'sent'
            : 'idle',
          intelligence
        };
      }),
      { onConflict: 'id' }
    );
    if (error) throw new Error(`Failed to upsert customers: ${error.message}`);
  }

  if (snapshot.invoices.length > 0) {
    const uuidInvoices = snapshot.invoices.filter(
      (invoice) => isUuid(invoice.id) && isUuid(invoice.customerId)
    );
    if (uuidInvoices.length > 0) {
      const { error } = await supabase.from('invoices').upsert(
        uuidInvoices.map((invoice) => ({
          id: invoice.id,
          tenant_id: tenantId,
          customer_id: invoice.customerId,
          external_id: invoice.id,
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
        })),
        { onConflict: 'id' }
      );
      if (error) throw new Error(`Failed to upsert invoices: ${error.message}`);
    }
  }

  const invoiceIds = new Set(snapshot.invoices.map((invoice) => invoice.id));
  const paymentRows = toPaymentRows(tenantId, snapshot.payments, invoiceIds);
  if (paymentRows.length > 0) {
    const { error } = await supabase
      .from('payments')
      .upsert(paymentRows, { onConflict: 'tenant_id,external_id' });
    if (error) throw new Error(`Failed to upsert payments: ${error.message}`);
  }

  if (snapshot.inboxMessages.length > 0) {
    const threads = snapshot.inboxMessages.filter(
      (message) => isUuid(message.id) && isUuid(message.customerId)
    );
    if (threads.length > 0) {
      const { error } = await supabase.from('inbox_threads').upsert(
        threads.map((message) => ({
          id: message.id,
          tenant_id: tenantId,
          customer_id: message.customerId,
          subject: message.subject,
          preview: message.preview,
          received_at: message.receivedAt,
          unread: message.unread,
          channel: message.channel,
          reply_intent: message.replyIntent ?? null,
          reply_intent_label: message.replyIntentLabel ?? null,
          agent_draft_ready: Boolean(message.agentDraftReady),
          suggested_action: message.suggestedAction ?? null
        })),
        { onConflict: 'id' }
      );
      if (error) throw new Error(`Failed to upsert inbox threads: ${error.message}`);
    }
  }

  const uuidDrafts = snapshot.drafts.filter((draft) => isUuid(draft.id) && isUuid(draft.threadId));
  if (uuidDrafts.length > 0) {
    const { error } = await supabase.from('agent_drafts').upsert(
      uuidDrafts.map((draft) => ({
        id: draft.id,
        tenant_id: tenantId,
        thread_id: draft.threadId,
        customer_id: draft.customerId || null,
        title: draft.title,
        body_text: draft.body,
        tone: draft.tone,
        prepared_at: draft.preparedAt
      })),
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
