import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CreditCard, FilePlus2, Search, Truck, Ticket as TicketIcon } from 'lucide-react';
import { ReadyForPickupTicket, ticketsApi } from '../lib/api';
import { navigate, ticketBillingPath } from '../lib/navigation';
import { ConfirmationModal } from './ConfirmationModal';
import { TableRowSkeleton } from './Skeleton';

const money = (value: string | number | null | undefined) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function ReadyForPickupPage() {
  const [search, setSearch] = useState('');
  const [deliverTicket, setDeliverTicket] = useState<ReadyForPickupTicket | null>(null);
  const queryClient = useQueryClient();
  const { data: tickets = [], isLoading } = useQuery({ queryKey: ['ready-for-pickup'], queryFn: ticketsApi.readyForPickup });
  
  const deliver = useMutation({
    mutationFn: ticketsApi.deliver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-for-pickup'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setDeliverTicket(null);
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tickets;
    return tickets.filter((ticket) => [
      ticket.ticketNumber,
      ticket.jobNumber,
      ticket.customer?.name,
      ticket.customer?.phone,
      ticket.brand,
      ticket.model,
      ticket.title
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term)));
  }, [tickets, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ready for Pickup</h1>
          <p className="mt-1 text-xs text-[#94A3B8]">{tickets.length} repair{tickets.length === 1 ? '' : 's'} ready for customer pickup</p>
        </div>
        <span className="rounded-full bg-teal-500/15 border border-teal-500/30 px-3 py-1.5 text-sm font-bold text-teal-300">
          {tickets.length}
        </span>
      </div>

      {/* Main Container */}
      <div className="bg-[#101622] border border-[#1b2536] rounded-xl shadow-xl overflow-hidden">
        
        {/* Search Header */}
        <div className="p-5 border-b border-[#1b2536]">
          <div className="relative max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, ticket, phone..."
              className="w-full h-11 bg-[#162030] border border-[#22314a] rounded-lg pl-10 pr-4 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#D99B26] transition-colors"
            />
          </div>
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead>
              <tr className="border-b border-[#1b2536] bg-[#0c111a]/60 text-[#64748B] uppercase tracking-wider font-semibold whitespace-nowrap">
                <th className="py-3.5 px-5">Ticket / Job No</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Device details</th>
                <th className="py-3.5 px-5">Total Billed</th>
                <th className="py-3.5 px-5">Invoice status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2536]/80 text-[#CBD5E1]">
              {isLoading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={6} />
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-[#162030] rounded-full flex items-center justify-center border border-[#22314a] shadow-inner">
                        <TicketIcon className="w-8 h-8 text-[#D99B26]" />
                      </div>
                      <div className="text-sm font-medium text-[#E2E8F0]">
                        No pickups ready
                      </div>
                      <div className="text-xs text-[#64748B] max-w-[250px]">
                        No repairs matched your criteria or are currently awaiting pickup.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => {
                  const invoice = ticket.invoice;
                  const paid = invoice?.paymentStatus === 'PAID';
                  const action = !invoice
                    ? { label: 'Create Invoice', icon: FilePlus2, onClick: () => navigate(ticketBillingPath(ticket.id)) }
                    : !paid
                    ? { label: 'Collect Payment', icon: CreditCard, onClick: () => navigate(ticketBillingPath(ticket.id)) }
                    : { label: 'Deliver', icon: Truck, onClick: () => setDeliverTicket(ticket) };
                  const ActionIcon = action.icon;

                  return (
                    <tr key={ticket.id} className="hover:bg-[#151d2d]/80 transition-colors group whitespace-nowrap">
                      {/* Ticket No */}
                      <td className="py-4 px-5 font-mono text-xs text-[#D99B26] font-bold">
                        {ticket.ticketNumber || ticket.jobNumber}
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-white font-semibold">{ticket.customer?.name || 'Walk-in Customer'}</span>
                          <span className="text-[10px] text-[#64748B] mt-0.5 font-mono">{ticket.customer?.phone || 'No phone'}</span>
                        </div>
                      </td>

                      {/* Device & Issue */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{[ticket.brand, ticket.model].filter(Boolean).join(' ') || ticket.title}</span>
                          <span className="text-[10px] text-[#64748B] truncate max-w-[240px] mt-0.5" title={ticket.reportedIssue || ticket.description}>
                            {ticket.reportedIssue || ticket.description}
                          </span>
                        </div>
                      </td>

                      {/* Total Billed */}
                      <td className="py-4 px-5 font-mono font-bold text-white">
                        {money(invoice?.total ?? ticket.totalAmount)}
                      </td>

                      {/* Invoice & Payment status */}
                      <td className="py-4 px-5">
                        {!invoice ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] text-[#94A3B8] font-bold">Invoice: Not Created</span>
                            <span className="text-[10px] text-amber-500 font-semibold mt-0.5">Payment Pending</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[11px] text-white font-bold">{invoice.invoiceNumber || 'Invoice Draft'}</span>
                            <span className={`text-[10px] font-bold mt-0.5 ${paid ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {paid ? 'PAID' : `${money(invoice.balanceDue)} due`}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={action.onClick}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#D99B26] hover:bg-[#E5A93C] text-xs font-bold text-[#0d121c] transition-colors shadow shadow-[#D99B26]/10 cursor-pointer"
                        >
                          <ActionIcon className="w-3.5 h-3.5" />
                          <span>{action.label}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1b2536] flex items-center justify-between text-xs text-[#64748B]">
          <div>
            Showing{' '}
            <span className="font-semibold text-white">
              {filtered.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-white">
              {tickets.length}
            </span>{' '}
            ready pickups
          </div>
        </div>

      </div>

      {/* Confirmation delivery modal */}
      <ConfirmationModal
        isOpen={!!deliverTicket}
        title="Mark Ticket as Delivered?"
        message={
          deliverTicket
            ? `Customer: ${deliverTicket.customer?.name || 'Walk-in Customer'} · Ticket: ${deliverTicket.ticketNumber || deliverTicket.jobNumber} · Device: ${[deliverTicket.brand, deliverTicket.model].filter(Boolean).join(' ') || deliverTicket.title} · Invoice: ${deliverTicket.invoice?.invoiceNumber || '—'} · Payment: PAID`
            : ''
        }
        confirmText="Mark as Delivered"
        onConfirm={() => deliverTicket && deliver.mutate(deliverTicket.id)}
        onCancel={() => setDeliverTicket(null)}
        isLoading={deliver.isPending}
      />
    </div>
  );
}
