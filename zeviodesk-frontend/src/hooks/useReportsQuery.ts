import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { queryKeys } from './queryKeys';

export function useReportsQuery() {
  const { isAuthenticated, currentUser } = useAppStore();

  return useQuery({
    queryKey: queryKeys.reports.platform,
    queryFn: () => reportsApi.fetchPlatformMetrics(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 2,
    enabled: isAuthenticated && currentUser?.role === 'SUPER_ADMIN',
  });
}
