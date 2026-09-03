import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  AgentConfig,
  AgingBucket,
  AgingReportFilters,
  IntegrationStatus,
  WorkspaceGeneralSettings
} from '../types';
import { getRevCollectService } from './index';
import type {
  RevCollectService,
  SendInboxFollowUpInput,
  CollectionDecisionInput,
  RelationshipPolicyInput
} from './service';
import type { DataAccessEvent, TenantId } from './types';
import type { InboxSendError } from '../extract/record-inbox-send';

export const revcollectKeys = {
  all: ['revcollect'] as const,
  tenant: () => [...revcollectKeys.all, 'tenant'] as const,
  inbox: () => [...revcollectKeys.all, 'inbox'] as const,
  inboxMessages: () => [...revcollectKeys.inbox(), 'messages'] as const,
  inboxSelection: (messageId: string) =>
    [...revcollectKeys.inbox(), 'selection', messageId] as const,
  inboxThreadForCustomer: (customerId: string) =>
    [...revcollectKeys.inbox(), 'customer', customerId] as const,
  customers: () => [...revcollectKeys.all, 'customers'] as const,
  customer: (id: string) => [...revcollectKeys.customers(), id] as const,
  customerContext: (id: string) => [...revcollectKeys.customers(), id, 'context'] as const,
  invoices: () => [...revcollectKeys.all, 'invoices'] as const,
  invoicesForCustomer: (customerId: string) =>
    [...revcollectKeys.invoices(), 'customer', customerId] as const,
  agingBuckets: () => [...revcollectKeys.all, 'aging', 'buckets'] as const,
  agingReport: (filters: AgingReportFilters) =>
    [
      ...revcollectKeys.all,
      'aging',
      'report',
      filters.period,
      filters.sort,
      filters.customerId ?? 'all'
    ] as const,
  invoicesByBucket: (bucket: AgingBucket) =>
    [...revcollectKeys.all, 'aging', 'bucket', bucket] as const,
  timeline: (customerId: string) => [...revcollectKeys.all, 'timeline', customerId] as const,
  agentConfig: () => [...revcollectKeys.all, 'agent', 'config'] as const,
  agentAddon: () => [...revcollectKeys.all, 'agent', 'addon'] as const,
  integrationStatus: () => [...revcollectKeys.all, 'integrations'] as const,
  workspaceGeneralSettings: () => [...revcollectKeys.all, 'settings', 'general'] as const,
  agentDraftCount: () => [...revcollectKeys.all, 'agent', 'draft-count'] as const,
  ariRun: () => [...revcollectKeys.all, 'ari', 'latest'] as const
};

const AR_STALE_TIME_MS = 60_000;

export function inboxMessagesQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.inboxMessages(),
    queryFn: () => getRevCollectService().listInboxMessages(),
    staleTime: 0,
    refetchOnMount: 'always'
  });
}

export function inboxSelectionQueryOptions(messageId: string | null) {
  return queryOptions({
    queryKey: revcollectKeys.inboxSelection(messageId ?? ''),
    queryFn: () => getRevCollectService().getInboxSelectionData(messageId!),
    enabled: !!messageId,
    staleTime: 0,
    refetchOnMount: 'always'
  });
}

export function customersQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.customers(),
    queryFn: () => getRevCollectService().listCustomers(),
    staleTime: AR_STALE_TIME_MS
  });
}

export function customerQueryOptions(id: string) {
  return queryOptions({
    queryKey: revcollectKeys.customer(id),
    queryFn: () => getRevCollectService().getCustomerById(id),
    staleTime: AR_STALE_TIME_MS
  });
}

export function customerContextQueryOptions(customerId: string) {
  return queryOptions({
    queryKey: revcollectKeys.customerContext(customerId),
    queryFn: async () => {
      const context = await getRevCollectService().getCustomerContext(customerId);
      return context;
    },
    staleTime: AR_STALE_TIME_MS
  });
}

export function invoicesQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.invoices(),
    queryFn: () => getRevCollectService().listInvoices(),
    staleTime: AR_STALE_TIME_MS
  });
}

export function invoicesForCustomerQueryOptions(customerId: string) {
  return queryOptions({
    queryKey: revcollectKeys.invoicesForCustomer(customerId),
    queryFn: () => getRevCollectService().getInvoicesForCustomer(customerId),
    staleTime: AR_STALE_TIME_MS
  });
}

export function agingBucketsQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.agingBuckets(),
    queryFn: () => getRevCollectService().getAgingBuckets(),
    staleTime: AR_STALE_TIME_MS
  });
}

export function agingReportQueryOptions(filters: AgingReportFilters) {
  return queryOptions({
    queryKey: revcollectKeys.agingReport(filters),
    queryFn: async () => {
      const service = getRevCollectService();
      if ('getAgingReport' in service && typeof service.getAgingReport === 'function') {
        return (
          service as RevCollectService & {
            getAgingReport: (filters: AgingReportFilters) => Promise<{
              summary: Awaited<ReturnType<RevCollectService['getAgingReportSummary']>>;
              chartBuckets: Awaited<ReturnType<RevCollectService['getAgingChartBuckets']>>;
              customerBreakdown: Awaited<
                ReturnType<RevCollectService['getAgingCustomerBreakdown']>
              >;
            }>;
          }
        ).getAgingReport(filters);
      }

      const [summary, chartBuckets, customerBreakdown] = await Promise.all([
        service.getAgingReportSummary(filters),
        service.getAgingChartBuckets(filters),
        service.getAgingCustomerBreakdown(filters)
      ]);
      return { summary, chartBuckets, customerBreakdown };
    },
    staleTime: AR_STALE_TIME_MS
  });
}

export function invoicesByBucketQueryOptions(bucket: AgingBucket) {
  return queryOptions({
    queryKey: revcollectKeys.invoicesByBucket(bucket),
    queryFn: () => getRevCollectService().getInvoicesByBucket(bucket),
    staleTime: AR_STALE_TIME_MS
  });
}

export function timelineQueryOptions(customerId: string) {
  return queryOptions({
    queryKey: revcollectKeys.timeline(customerId),
    queryFn: () => getRevCollectService().getTimelineForCustomer(customerId),
    staleTime: AR_STALE_TIME_MS
  });
}

export function agentConfigQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.agentConfig(),
    queryFn: () => getRevCollectService().getAgentConfig(),
    staleTime: AR_STALE_TIME_MS
  });
}

export function agentAddonQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.agentAddon(),
    queryFn: () => getRevCollectService().getAgentAddonStatus(),
    staleTime: AR_STALE_TIME_MS
  });
}

export function integrationStatusQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.integrationStatus(),
    queryFn: async () => {
      const response = await fetch('/api/integrations/status');
      if (!response.ok) {
        throw new Error('Failed to load integration status');
      }
      return response.json() as Promise<IntegrationStatus>;
    },
    staleTime: 30_000
  });
}

export function workspaceGeneralSettingsQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.workspaceGeneralSettings(),
    queryFn: () => getRevCollectService().getWorkspaceGeneralSettings(),
    staleTime: AR_STALE_TIME_MS
  });
}

export function useInboxMessages() {
  return useQuery(inboxMessagesQueryOptions());
}

export function useInboxSelectionData(messageId: string | null) {
  const query = useQuery({
    ...inboxSelectionQueryOptions(messageId),
    placeholderData: keepPreviousData
  });
  return {
    ...query,
    data: query.data ?? null
  };
}

export function useCustomers() {
  return useQuery(customersQueryOptions());
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    ...customerQueryOptions(id ?? ''),
    enabled: !!id,
    placeholderData: keepPreviousData
  });
}

export function useCustomerInboxContext(customerId: string | undefined) {
  return useQuery({
    ...customerContextQueryOptions(customerId ?? ''),
    enabled: !!customerId
  });
}

export function useInvoices() {
  return useQuery(invoicesQueryOptions());
}

export function useInvoicesForCustomer(customerId: string | undefined) {
  return useQuery({
    ...invoicesForCustomerQueryOptions(customerId ?? ''),
    enabled: !!customerId
  });
}

export function useAgingBuckets() {
  return useQuery(agingBucketsQueryOptions());
}

export function useAgingReport(filters: AgingReportFilters) {
  return useQuery(agingReportQueryOptions(filters));
}

export function useInvoicesByBucket(bucket: AgingBucket) {
  return useQuery(invoicesByBucketQueryOptions(bucket));
}

export function useTimelineForCustomer(customerId: string | undefined) {
  return useQuery({
    ...timelineQueryOptions(customerId ?? ''),
    enabled: !!customerId
  });
}

export function useInboxThreadForCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: revcollectKeys.inboxThreadForCustomer(customerId ?? ''),
    queryFn: () => getRevCollectService().getInboxThreadForCustomer(customerId!),
    enabled: !!customerId,
    staleTime: AR_STALE_TIME_MS
  });
}

export function useThreadEmails(threadId: string | undefined) {
  return useQuery({
    queryKey: [...revcollectKeys.inbox(), 'thread', threadId ?? ''] as const,
    queryFn: () => getRevCollectService().getThreadEmails(threadId!),
    enabled: !!threadId,
    staleTime: AR_STALE_TIME_MS
  });
}

export function useAgentConfig() {
  return useQuery(agentConfigQueryOptions());
}

export function useAgentAddonStatus() {
  return useQuery(agentAddonQueryOptions());
}

export function useUpdateAgentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: AgentConfig) => getRevCollectService().updateAgentConfig(config),
    onSuccess: (data) => {
      queryClient.setQueryData(revcollectKeys.agentConfig(), data);
    }
  });
}

export function useSubscribeAgentAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getRevCollectService().subscribeAgentAddon(),
    onSuccess: (data) => {
      queryClient.setQueryData(revcollectKeys.agentAddon(), data);
      toast.success('Collections Agent add-on subscribed');
    },
    onError: () => {
      toast.error('Could not subscribe to add-on');
    }
  });
}

export function useActivateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getRevCollectService().activateAgent(),
    onSuccess: (result) => {
      if (result.needsBilling) return;
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.agentConfig() });
      toast.success('Agent activated');
    }
  });
}

export function useIntegrationStatus() {
  return useQuery(integrationStatusQueryOptions());
}

export type IntegrationProviderKey = 'xero' | 'gmail' | 'quickbooks' | 'zoho';

export interface XeroResyncResult {
  lastSyncAt: string | null;
  customerCount: number;
  invoiceCount: number;
}

interface XeroResyncError extends Error {
  status?: number;
  code?: 'xero_expired' | 'xero_disconnected';
}

function disconnectPath(provider: IntegrationProviderKey): string {
  switch (provider) {
    case 'xero':
      return '/api/integrations/xero/disconnect';
    case 'gmail':
      return '/api/integrations/gmail/disconnect';
    case 'quickbooks':
      return '/api/integrations/quickbooks/disconnect';
    case 'zoho':
      return '/api/integrations/zoho/disconnect';
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

function disconnectToast(provider: IntegrationProviderKey): string {
  switch (provider) {
    case 'xero':
      return 'Xero disconnected';
    case 'gmail':
      return 'Gmail disconnected';
    case 'quickbooks':
      return 'QuickBooks disconnected';
    case 'zoho':
      return 'Zoho Books disconnected';
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (provider: IntegrationProviderKey) => {
      const response = await fetch(disconnectPath(provider), { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }
    },
    onSuccess: (_data, provider) => {
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.integrationStatus() });
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.all });
      toast.success(disconnectToast(provider));
    },
    onError: () => {
      toast.error('Could not disconnect');
    }
  });
}

export function useResyncXero() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<XeroResyncResult> => {
      const response = await fetch('/api/integrations/xero/resync', { method: 'POST' });
      if (!response.ok) {
        let body: { error?: string; code?: XeroResyncError['code'] } = {};
        try {
          body = (await response.json()) as { error?: string; code?: XeroResyncError['code'] };
        } catch {
          // Keep a generic message when the body is not JSON.
        }
        const error: XeroResyncError = new Error(body.error ?? 'Xero resync failed');
        error.status = response.status;
        error.code = body.code;
        throw error;
      }
      return response.json() as Promise<XeroResyncResult>;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.integrationStatus() });
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.all });
      toast.success(`Synced ${result.customerCount} customers, ${result.invoiceCount} invoices`);
    },
    onError: (error) => {
      const resyncError = error as XeroResyncError;
      if (resyncError.status === 409) {
        void queryClient.invalidateQueries({ queryKey: revcollectKeys.integrationStatus() });
        toast.error('Accounting session expired. Reconnect in Settings → Integrations.');
        return;
      }
      toast.error(resyncError.message || 'Could not resync accounting');
    }
  });
}

export function useWorkspaceGeneralSettings() {
  return useQuery(workspaceGeneralSettingsQueryOptions());
}

export function useUpdateWorkspaceGeneralSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: WorkspaceGeneralSettings) =>
      getRevCollectService().updateWorkspaceGeneralSettings(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(revcollectKeys.workspaceGeneralSettings(), data);
      toast.success('Settings saved');
    },
    onError: () => {
      toast.error('Could not save settings');
    }
  });
}

export function useAgentDraftCount() {
  return useQuery({
    queryKey: revcollectKeys.agentDraftCount(),
    queryFn: () => getRevCollectService().countAgentDraftsReady(),
    staleTime: AR_STALE_TIME_MS
  });
}

export function useLatestAriRun() {
  return useQuery({
    queryKey: revcollectKeys.ariRun(),
    queryFn: () => getRevCollectService().getLatestAriRun(),
    staleTime: AR_STALE_TIME_MS
  });
}

export function useLogDataAccess() {
  const service = getRevCollectService();
  return useMutation({
    mutationFn: (event: DataAccessEvent) => service.logDataAccess(event)
  });
}

export function useExportTenantData() {
  return useMutation({
    mutationFn: async (tenantId: TenantId) => {
      const data = await getRevCollectService().exportTenantData(tenantId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `revcollect-export-${tenantId}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      return data;
    },
    onSuccess: () => {
      toast.success('Data export downloaded');
    },
    onError: () => {
      toast.error('Export failed');
    }
  });
}

export function useRequestTenantDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: TenantId) => getRevCollectService().requestTenantDeletion(tenantId),
    onSuccess: (result) => {
      toast.message(result.message);
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.all });
    },
    onError: () => {
      toast.error('Deletion request failed');
    }
  });
}

export function useSendInboxFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendInboxFollowUpInput) => getRevCollectService().sendInboxFollowUp(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.inbox() });
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.customers() });
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.all });
      toast.success('Follow-up sent');
    },
    onError: (error) => {
      const sendError = error as InboxSendError;
      if (
        sendError.status === 409 ||
        sendError.code === 'gmail_expired' ||
        sendError.code === 'gmail_disconnected'
      ) {
        toast.error(sendError.message || 'Gmail session expired. Reconnect Gmail.', {
          action: {
            label: 'Reconnect',
            onClick: () => {
              window.location.assign('/settings/integrations');
            }
          }
        });
        return;
      }
      toast.error(sendError.message || 'Could not send follow-up');
    }
  });
}

export function useRecordCollectionDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CollectionDecisionInput) =>
      getRevCollectService().recordCollectionDecision(input),
    onSuccess: (_customer, input) => {
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.all });
      switch (input.action) {
        case 'promised':
          toast.success('Marked as promised');
          return;
        case 'dispute':
          toast.success('Marked as dispute');
          return;
        case 'chase_again':
          toast.success('Ready to chase again');
          return;
        default: {
          const _exhaustive: never = input.action;
          return _exhaustive;
        }
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not update this thread');
    }
  });
}

export function useRecordRelationshipPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RelationshipPolicyInput) =>
      getRevCollectService().recordRelationshipPolicy(input),
    onSuccess: (_customer, input) => {
      void queryClient.invalidateQueries({ queryKey: revcollectKeys.all });
      switch (input.action) {
        case 'pause':
          toast.success('Follow-ups paused');
          return;
        case 'resume':
          toast.success('Collections resumed');
          return;
        case 'extend':
          toast.success('Waiting a bit longer');
          return;
        case 'keep_paused':
          toast.success('Kept paused');
          return;
        case 'dismiss_suggestion':
          toast.success('Suggestion dismissed');
          return;
        case 'confirm_suggestion':
          toast.success('Saved');
          return;
        case 'set_mode':
          toast.success('Relationship mode updated');
          return;
        case 'update_contact':
          toast.success('Contact updated');
          return;
        default: {
          const _exhaustive: never = input.action;
          return _exhaustive;
        }
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not update relationship');
    }
  });
}
