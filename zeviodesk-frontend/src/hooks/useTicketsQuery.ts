import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, ticketsApi, FetchTicketsParams, Payment, paymentsApi, CreateTicketPayload, UpdateTicketPayload } from '../lib/api';

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTicketsQuery(params: FetchTicketsParams = {}) {
  return useQuery<Ticket[], Error>({
    queryKey: ['tickets', params],
    queryFn: () => ticketsApi.fetchAll(params),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    retry: 2,
  });
}

export function useTicketQuery(id: string | undefined) {
  return useQuery<Ticket, Error>({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.fetchOne(id!),
    enabled: !!id,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketPayload) => ticketsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useUpdateTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string; data: UpdateTicketPayload }) =>
      ticketsApi.update(variables.id, variables.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', updated.id] });
    },
  });
}

export function useDeleteTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

// ─── Payments ────────────────────────────────────────────────────────────────

export function usePaymentsQuery(ticketId: string | undefined) {
  return useQuery<Payment[], Error>({
    queryKey: ['payments', ticketId],
    queryFn: () => paymentsApi.list(ticketId!),
    enabled: !!ticketId,
  });
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { ticketId: string; data: Partial<Payment> }) =>
      paymentsApi.create(variables.ticketId, variables.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// ─── Line Items & Invoices ───────────────────────────────────────────────────
import { lineItemsApi, invoiceApi, TicketLineItem, Invoice, InvoiceDraftSummary } from '../lib/api';

export function useLineItemsQuery(ticketId: string | undefined) {
  return useQuery<TicketLineItem[], Error>({
    queryKey: ['line-items', ticketId],
    queryFn: () => lineItemsApi.list(ticketId!),
    enabled: !!ticketId,
  });
}

export function useAddLineItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { ticketId: string; data: Partial<TicketLineItem> }) =>
      lineItemsApi.add(variables.ticketId, variables.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['line-items', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateLineItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { ticketId: string; lineItemId: string; data: Partial<TicketLineItem> }) =>
      lineItemsApi.update(variables.ticketId, variables.lineItemId, variables.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['line-items', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useRemoveLineItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { ticketId: string; lineItemId: string }) =>
      lineItemsApi.remove(variables.ticketId, variables.lineItemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['line-items', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useInvoiceQuery(ticketId: string | undefined) {
  return useQuery<Invoice | InvoiceDraftSummary, Error>({
    queryKey: ['invoice', ticketId],
    queryFn: () => invoiceApi.get(ticketId!),
    enabled: !!ticketId,
  });
}

export function useFinalizeInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { ticketId: string; data: { invoiceNumber?: string; notes?: string; dueDate?: string } }) =>
      invoiceApi.finalize(variables.ticketId, variables.data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', invoice.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useVoidInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { ticketId: string; data: { reason: string } }) =>
      invoiceApi.void(variables.ticketId, variables.data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', invoice.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

