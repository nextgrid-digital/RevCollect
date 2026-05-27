export type CollectionStatus =
  | 'current'
  | 'due_soon'
  | 'overdue'
  | 'in_dispute'
  | 'promised';

export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';

export type MessageChannel = 'email' | 'sms';

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
  body: string;
  receivedAt: string;
  unread: boolean;
  channel: MessageChannel;
}

export interface TimelineEvent {
  id: string;
  customerId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  occurredAt: string;
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
