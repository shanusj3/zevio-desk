import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesListApi, invoiceSettingsApi, InvoiceListItem, InvoicingSettings, request } from '../lib/api';
import { applyAndCacheTheme } from '../lib/theme';

// ── Invoice List ──────────────────────────────────────────────────────────────
export function useInvoicesListQuery(params?: { paymentStatus?: string; q?: string }) {
  return useQuery<InvoiceListItem[], Error>({
    queryKey: ['invoices', params],
    queryFn: () => invoicesListApi.list(params),
  });
}

// ── Invoicing Settings ────────────────────────────────────────────────────────
export function useInvoicingSettingsQuery() {
  const searchParams = new URLSearchParams(window.location.search);
  const paramSlug = searchParams.get('tenant');
  const path = paramSlug ? `/settings/invoicing?tenant=${encodeURIComponent(paramSlug)}` : '/settings/invoicing';

  return useQuery<InvoicingSettings, Error>({
    queryKey: ['invoicingSettings', paramSlug],
    queryFn: () => request<InvoicingSettings>(path),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateInvoiceTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation<InvoicingSettings, Error, InvoicingSettings>({
    mutationFn: (data) => invoiceSettingsApi.update(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['invoicingSettings'] });
      // Immediately apply the tenant theme so the dashboard reflects the
      // updated primary color without waiting for the AppLayout useEffect
      // to re-fire from the refetched query.
      if (updated.primaryColor) {
        applyAndCacheTheme({
          primaryColor: updated.primaryColor,
          logoUrl: updated.logoUrl,
        });
      }
    },
  });
}
