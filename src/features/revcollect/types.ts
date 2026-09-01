export type CollectionStatus = 'current' | 'due_soon' | 'overdue' | 'in_dispute' | 'promised';

export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';

export type MessageChannel = 'email' | 'sms';

export type ConversationAuthor = 'customer' | 'agent';

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ThreadEmail {
  id: string;
  threadId: string;
  customerId?: string;
  gmailThreadId?: string;
  author: ConversationAuthor;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  sentAt: string;
  attachments?: EmailAttachment[];
}

/** @deprecated Use ThreadEmail */
export type ThreadMessage = ThreadEmail;

export type TimelineEventType =
  | 'email_sent'
  | 'email_received'
  | 'call'
  | 'payment'
  | 'note'
  | 'promise';

export type RelationshipState =
  | 'normal'
  | 'sensitive_event'
  | 'active_dispute'
  | 'payment_claimed'
  | 'paused_until_date'
  | 'manual_only'
  | 'founder_only'
  | 'do_not_contact'
  | 'resume_review';

export type RelationshipReason =
  | 'bereavement'
  | 'medical'
  | 'family_emergency'
  | 'cash_flow'
  | 'dispute'
  | 'payment_claimed'
  | 'wrong_contact'
  | 'vip_customer'
  | 'manual';

export type RelationshipScope = 'customer' | 'invoice' | 'contact';

export type RelationshipPauseMode = 'no_follow_ups' | 'manual_only' | 'founder_only';

export interface RelationshipSuggestion {
  state: RelationshipState;
  reason: RelationshipReason;
  quote: string;
  sourceMessageId?: string;
  suggestedPauseDays: number;
  proposedEmail?: string;
}

export interface RelationshipPolicy {
  state: RelationshipState;
  reason?: RelationshipReason;
  scope: RelationshipScope;
  invoiceId?: string;
  contactEmail?: string;
  pauseUntil?: string;
  pauseMode?: RelationshipPauseMode;
  sourceMessageId?: string;
  sourceQuote?: string;
  internalNote?: string;
  doNotContact: string[];
  preferredEmail?: string;
  pendingSuggestion?: RelationshipSuggestion;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  avatarUrl?: string;
  status: CollectionStatus;
  balanceCents: number;
  daysOverdue: number;
  promisedDate?: string;
  classifiedReplyId?: string;
  relationshipState?: RelationshipState;
  relationshipPolicy?: RelationshipPolicy;
}

export type ReplyIntent = 'deflection' | 'promise' | 'dispute' | 'payment_confirmation' | 'other';

export type AgentDraftTone = 'professional' | 'friendly' | 'firm';

/** Extended context shown in the inbox right rail. */
export interface CustomerInboxContext {
  avgDsoDays: number;
  lifetimeValueCents: number;
  followUpsSent: number;
  paymentTerms: string;
  source: string;
  aiInsight: string;
  deepAnalysis?: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  number: string;
  /** Invoice face value (Xero Total). */
  amountCents: number;
  dueDate: string;
  status: CollectionStatus;
  agingBucket: AgingBucket;
  issueDate?: string;
  paidCents?: number;
  xeroStatus?: string;
  /** Remaining open AR. Aging, inbox, and ARI use this — not amountCents. */
  amountDueCents?: number;
  /** ISO date when Xero marked the invoice fully paid. */
  paidAt?: string;
}

export interface InboxMessage {
  id: string;
  customerId: string;
  subject: string;
  preview: string;
  receivedAt: string;
  unread: boolean;
  channel: MessageChannel;
  replyIntent?: ReplyIntent;
  replyIntentLabel?: string;
  agentDraftReady?: boolean;
  suggestedAction?: string;
}

export interface AgentDraftMeta {
  title: string;
  preparedAtLabel: string;
  body: string;
  tone: AgentDraftTone;
}

export interface LastActionInsight {
  title: string;
  occurredAtLabel: string;
}

export interface TimelineEvent {
  id: string;
  customerId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  occurredAt: string;
  /** When set, activity click scrolls to this thread email. */
  threadEmailId?: string;
}

export type AgentFollowUpStyle = 'gentle' | 'balanced' | 'assertive';

export interface AgentRiskThresholds {
  healthyDays: [number, number];
  watchDays: [number, number];
  urgentDays: [number, number];
  criticalDaysMin: number;
}

export interface AgentCustomerOverride {
  customerId: string;
  style: AgentFollowUpStyle;
  note: string;
}

export interface AgentBehaviors {
  earlyPaymentDiscount: boolean;
  autoClassifyEmails: boolean;
  promiseTracking: boolean;
  dailyDigest: boolean;
  autoDraftFollowUps: boolean;
  escalationAlerts: boolean;
  digestHour: number;
  defaultPauseDays: number;
  overnightDraftManualOnly: boolean;
  allowLateFeeMentions: boolean;
  allowLegalLanguage: boolean;
}

export interface AgentDigestPreview {
  dateLabel: string;
  bullets: string[];
}

export interface AriRunRecord {
  id: string;
  ranAt: string;
  hourLabel: string;
  bullets: string[];
}

export interface AgentAddonStatus {
  subscribed: boolean;
  priceMonthlyCents: number;
  estimatedAiCostMonthlyCents: number;
}

export interface AgentActivationResult {
  active: boolean;
  needsBilling?: boolean;
}

export interface AgentConfig {
  tone: 'professional' | 'friendly' | 'firm';
  followUpStyle: AgentFollowUpStyle;
  isActive: boolean;
  riskThresholds: AgentRiskThresholds;
  customerOverrides: AgentCustomerOverride[];
  behaviors: AgentBehaviors;
  digestPreview: AgentDigestPreview;
  autoSendEnabled: boolean;
  escalationRules: string;
  signature: string;
}

export interface WorkspaceGeneralSettings {
  companyName: string;
  industry: string;
  primaryContactEmail: string;
  timezone: string;
  reminderSequence: {
    firstReminderDays: number;
    secondReminderDays: number;
    thirdReminderDays: number;
    finalNoticeDays: number;
  };
  sendFromName: string;
  replyToEmail: string;
  emailSignature: string;
  notifications: {
    paymentReceived: boolean;
    customerReplied: boolean;
    invoiceOverdue: boolean;
    weeklySummary: boolean;
  };
}

export interface IntegrationConnection {
  connected: boolean;
  label: string;
  detail?: string;
  lastSyncAt?: string | null;
}

export interface IntegrationStatus {
  gmail: IntegrationConnection;
  xero: IntegrationConnection;
  stripe: IntegrationConnection;
}

export interface AgingBucketSummary {
  bucket: AgingBucket;
  label: string;
  invoiceCount: number;
  totalCents: number;
}

export type AgingReportBucket = 'current' | '1-15' | '16-30' | '31-60' | '60+';

export type AgingReportPeriod = 'this_month' | 'last_month' | 'all_time';

export type AgingReportSort = 'amount_desc' | 'amount_asc' | 'customer_asc';

export type AgingRiskLevel = 'low' | 'medium' | 'high';

export interface AgingReportFilters {
  customerId?: string;
  period: AgingReportPeriod;
  sort: AgingReportSort;
}

export interface AgingReportSummary {
  totalArCents: number;
  currentCents: number;
  overdueCents: number;
  weightedAvgDsoDays: number;
  totalArDeltaPct: number;
  currentDeltaPct: number;
  overdueDeltaPct: number;
  dsoDeltaDays: number;
}

export interface AgingChartBucketRow {
  bucket: AgingReportBucket;
  label: string;
  invoiceCount: number;
  totalCents: number;
}

export interface AgingCustomerBreakdownRow {
  customerId: string;
  company: string;
  invoiceCount: number;
  currentCents: number;
  days1to30Cents: number;
  days31to60Cents: number;
  days60PlusCents: number;
  totalCents: number;
  risk: AgingRiskLevel;
  relationshipLabel?: string | null;
}
