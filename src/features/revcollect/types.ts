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

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  avatarUrl?: string;
  status: CollectionStatus;
  balanceCents: number;
  daysOverdue: number;
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
  amountCents: number;
  dueDate: string;
  status: CollectionStatus;
  agingBucket: AgingBucket;
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

export interface AgentConfig {
  tone: 'professional' | 'friendly' | 'firm';
  autoSendEnabled: boolean;
  escalationRules: string;
  signature: string;
}

export interface IntegrationConnection {
  connected: boolean;
  label: string;
  detail?: string;
}

export interface IntegrationStatus {
  quickbooks: IntegrationConnection;
  gmail: IntegrationConnection;
  stripe: IntegrationConnection;
}

export interface AgingBucketSummary {
  bucket: AgingBucket;
  label: string;
  invoiceCount: number;
  totalCents: number;
}
