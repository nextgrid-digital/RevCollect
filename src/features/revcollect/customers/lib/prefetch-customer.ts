import type { QueryClient } from '@tanstack/react-query';
import { customerQueryOptions } from '../../api/queries';

export function prefetchCustomer(queryClient: QueryClient, customerId: string) {
  void queryClient.prefetchQuery(customerQueryOptions(customerId));
}
