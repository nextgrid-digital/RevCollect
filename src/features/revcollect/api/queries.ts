import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AgingBucket } from '../types';
import { getRevCollectService } from './index';
import type { DataAccessEvent, TenantId } from './types';

export const revcollectKeys = {
  all: ['revcollect'] as const,
  tenant: () => [...revcollectKeys.all, 'tenant'] as const,
  inbox: () => [...revcollectKeys.all, 'inbox'] as const,
  inboxMessages: () => [...revcollectKeys.inbox(), 'messages'] as const,
  inboxSelection: (messageId: string) =>
    [...revcollectKeys.inbox(), 'selection', messageId] as const,
  customers: () => [...revcollectKeys.all, 'customers'] as const,
  customer: (id: string) => [...revcollectKeys.customers(), id] as const,
  invoices: () => [...revcollectKeys.all, 'invoices'] as const,
  invoicesForCustomer: (customerId: string) =>
    [...revcollectKeys.invoices(), 'customer', customerId] as const,
  agingBuckets: () => [...revcollectKeys.all, 'aging', 'buckets'] as const,
  invoicesByBucket: (bucket: AgingBucket) =>
    [...revcollectKeys.all, 'aging', 'bucket', bucket] as const,
  timeline: (customerId: string) => [...revcollectKeys.all, 'timeline', customerId] as const,
  agentConfig: () => [...revcollectKeys.all, 'agent', 'config'] as const,
  integrationStatus: () => [...revcollectKeys.all, 'integrations'] as const,
  agentDraftCount: () => [...revcollectKeys.all, 'agent', 'draft-count'] as const
};

const MOCK_STALE_TIME = Infinity;

export function inboxMessagesQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.inboxMessages(),
    queryFn: () => getRevCollectService().listInboxMessages(),
    staleTime: MOCK_STALE_TIME
  });
}

export function inboxSelectionQueryOptions(messageId: string | null) {
  return queryOptions({
    queryKey: revcollectKeys.inboxSelection(messageId ?? ''),
    queryFn: () => getRevCollectService().getInboxSelectionData(messageId!),
    enabled: !!messageId,
    staleTime: MOCK_STALE_TIME
  });
}

export function customersQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.customers(),
    queryFn: () => getRevCollectService().listCustomers(),
    staleTime: MOCK_STALE_TIME
  });
}

export function customerQueryOptions(id: string) {
  return queryOptions({
    queryKey: revcollectKeys.customer(id),
    queryFn: () => getRevCollectService().getCustomerById(id),
    staleTime: MOCK_STALE_TIME
  });
}

export function invoicesForCustomerQueryOptions(customerId: string) {
  return queryOptions({
    queryKey: revcollectKeys.invoicesForCustomer(customerId),
    queryFn: () => getRevCollectService().getInvoicesForCustomer(customerId),
    staleTime: MOCK_STALE_TIME
  });
}

export function agingBucketsQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.agingBuckets(),
    queryFn: () => getRevCollectService().getAgingBuckets(),
    staleTime: MOCK_STALE_TIME
  });
}

export function invoicesByBucketQueryOptions(bucket: AgingBucket) {
  return queryOptions({
    queryKey: revcollectKeys.invoicesByBucket(bucket),
    queryFn: () => getRevCollectService().getInvoicesByBucket(bucket),
    staleTime: MOCK_STALE_TIME
  });
}

export function timelineQueryOptions(customerId: string) {
  return queryOptions({
    queryKey: revcollectKeys.timeline(customerId),
    queryFn: () => getRevCollectService().getTimelineForCustomer(customerId),
    staleTime: MOCK_STALE_TIME
  });
}

export function agentConfigQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.agentConfig(),
    queryFn: () => getRevCollectService().getAgentConfig(),
    staleTime: MOCK_STALE_TIME
  });
}

export function integrationStatusQueryOptions() {
  return queryOptions({
    queryKey: revcollectKeys.integrationStatus(),
    queryFn: () => getRevCollectService().getIntegrationStatus(),
    staleTime: MOCK_STALE_TIME
  });
}

export function useInboxMessages() {
  return useQuery(inboxMessagesQueryOptions());
}

export function useInboxSelectionData(messageId: string | null) {
  const query = useQuery(inboxSelectionQueryOptions(messageId));
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
    enabled: !!id
  });
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

export function useInvoicesByBucket(bucket: AgingBucket) {
  return useQuery(invoicesByBucketQueryOptions(bucket));
}

export function useTimelineForCustomer(customerId: string | undefined) {
  return useQuery({
    ...timelineQueryOptions(customerId ?? ''),
    enabled: !!customerId
  });
}

export function useAgentConfig() {
  return useQuery(agentConfigQueryOptions());
}

export function useIntegrationStatus() {
  return useQuery(integrationStatusQueryOptions());
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
