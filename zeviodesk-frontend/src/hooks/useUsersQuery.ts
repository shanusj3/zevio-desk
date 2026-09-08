import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TenantUser, usersApi } from '../lib/api';
import { queryKeys } from './queryKeys';

export function useUsersQuery(staffOnly = true) {
  return useQuery<TenantUser[], Error>({
    queryKey: queryKeys.users.list(staffOnly),
    queryFn: () => usersApi.fetchAll(staffOnly),
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TenantUser> & { password?: string }) =>
      usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string; data: Partial<TenantUser> & { password?: string } }) =>
      usersApi.update(variables.id, variables.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
