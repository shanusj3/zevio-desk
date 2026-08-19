import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesListApi, invoiceSettingsApi, InvoiceListItem, InvoicingSettings } from '../lib/api';

// ── Invoice List ──────────────────────────────────────────────────────────────
export function useInvoicesListQuery(params?: { paymentStatus?: string; q?: string }) {
  return useQuery<InvoiceListItem[], Error>({
    queryKey: ['invoices', params],
    queryFn: () => invoicesListApi.list(params),
  });
}

// ── Invoicing Settings ────────────────────────────────────────────────────────
export function useInvoicingSettingsQuery() {
  return useQuery<InvoicingSettings, Error>({
    queryKey: ['invoicingSettings'],
    queryFn: () => invoiceSettingsApi.get(),
  });
}

export function useUpdateInvoiceTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation<InvoicingSettings, Error, InvoicingSettings>({
    mutationFn: (data) => invoiceSettingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoicingSettings'] });
    },
  });
}
