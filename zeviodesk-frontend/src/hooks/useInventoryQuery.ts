import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../lib/api';
import { queryKeys } from './queryKeys';

export function useInventoryItemsQuery(params?: {
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
  includeInactive?: boolean;
  skip?: number;
  take?: number;
}) {
  return useQuery({
    queryKey: queryKeys.inventory.list(params),
    queryFn: () => inventoryApi.list(params),
  });
}

export function useInventoryCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.categories,
    queryFn: inventoryApi.categories,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.categories });
    },
  });
}

export function useRenameCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.renameCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.categories });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.categories });
    },
  });
}

export function useInventoryItemQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.inventory.item(id),
    queryFn: () => inventoryApi.getOne(id),
    enabled: !!id,
  });
}

export function useInventoryMovementsQuery(id: string, skip = 0, take = 30) {
  return useQuery({
    queryKey: queryKeys.inventory.movements(id, skip, take),
    queryFn: () => inventoryApi.movements(id, skip, take),
    enabled: !!id,
  });
}

export function useCreateInventoryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.categories });
    },
  });
}

export function useUpdateInventoryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      inventoryApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.item(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.categories });
    },
  });
}

export function useDeactivateInventoryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.deactivate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.item(id) });
    },
  });
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity, reason }: { id: string; quantity: number; reason?: string }) =>
      inventoryApi.adjustStock(id, quantity, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.item(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.movements(variables.id) });
    },
  });
}

export function useSetInventoryEnabledMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.setEnabled,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.settings() });
    },
  });
}
