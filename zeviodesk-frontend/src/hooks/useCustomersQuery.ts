import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer, customersApi, FetchCustomersParams, PaginatedCustomers } from '../lib/api';

export function useCustomersQuery() {
  return useQuery<Customer[], Error>({ queryKey: ['customers'], queryFn: () => customersApi.fetchAll().then((page) => page.customers), staleTime: 1000 * 60 * 2, retry: 2 });
}


export function useInfiniteCustomersQuery(params: FetchCustomersParams = {}) {
  return useInfiniteQuery<PaginatedCustomers, Error>({
    queryKey: ['customers-infinite', params.search, params.alphabet],
    queryFn: ({ pageParam = 1 }) => customersApi.fetchAll({ ...params, page: pageParam as number }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 0,
    gcTime: 0,
  });
}
export function useCustomerSearchQuery(search: string) {
  return useQuery<Customer[], Error>({
    queryKey: ['customers', 'search', search],
    queryFn: () => customersApi.fetchAll({ search }).then((page) => page.customers),
    enabled: search.length > 0,
    staleTime: 1000 * 30,
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (data: Partial<Customer>) => customersApi.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); queryClient.invalidateQueries({ queryKey: ['customers-infinite'] }); } });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (variables: { id: string; data: Partial<Customer> }) => customersApi.update(variables.id, variables.data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); queryClient.invalidateQueries({ queryKey: ['customers-infinite'] }); } });
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => customersApi.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); queryClient.invalidateQueries({ queryKey: ['customers-infinite'] }); } });
}
