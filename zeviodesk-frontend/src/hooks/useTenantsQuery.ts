import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Tenant } from '../types';
import { tenantsApi, FetchTenantsParams, PaginatedTenants } from '../lib/api';
import { applyAndCacheTheme } from '../lib/theme';
import { queryKeys } from './queryKeys';

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTenantsQuery(params: FetchTenantsParams = {}) {
  return useQuery({
    queryKey: queryKeys.tenants.list(params),
    queryFn: () => tenantsApi.fetchAll(params),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    retry: 2,
  });
}

export function useInfiniteTenantsQuery(params: FetchTenantsParams = {}) {
  return useInfiniteQuery<PaginatedTenants, Error>({
    queryKey: queryKeys.tenants.infinite(params.search, params.status, params.alphabet),
    queryFn: ({ pageParam = 1 }) => tenantsApi.fetchAll({ ...params, page: pageParam as number }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    staleTime: 0, // Always refetch when queryKey changes (filter/search change)
    gcTime: 0,    // Don't cache old results — prevents stale data flash on filter change
  });
}

export function useTenantQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id),
    queryFn: () => tenantsApi.fetchOne(id!),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Tenant> & { logoFile?: File | null }) => {
      const finalData = { ...data };
      if (data.logoFile) {
        const tenantId = data.id || crypto.randomUUID();
        finalData.id = tenantId;
        const presigned = await tenantsApi.getPresignedUrl(tenantId, data.logoFile.type);
        await tenantsApi.uploadToS3(presigned.url, presigned.fields, data.logoFile);
        finalData.logoUrl = presigned.fileUrl;
      }
      delete finalData.logoFile;
      return tenantsApi.create(finalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.infinite() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useUpdateTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Tenant & { logoFile?: File | null }) => {
      const finalData = { ...data };
      if (data.logoFile) {
        const presigned = await tenantsApi.getPresignedUrl(data.id, data.logoFile.type);
        await tenantsApi.uploadToS3(presigned.url, presigned.fields, data.logoFile);
        finalData.logoUrl = presigned.fileUrl;
      }
      delete finalData.logoFile;
      return tenantsApi.update(finalData.id, finalData);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.infinite() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.settings() });
      queryClient.setQueryData(queryKeys.tenants.detail(updated.id), updated);
      if (updated.primaryColor) {
        applyAndCacheTheme({
          primaryColor: updated.primaryColor,
          logoUrl: updated.logoUrl,
        }, updated.subdomain);
      }
    },
  });
}

export function useToggleTenantStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.toggleStatus(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.infinite() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      return updated;
    },
  });
}

export function useDeleteTenantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.infinite() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
