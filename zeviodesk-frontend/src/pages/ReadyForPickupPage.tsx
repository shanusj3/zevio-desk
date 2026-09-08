import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Search, Truck, CheckCircle2, X, Loader2 } from 'lucide-react';
import { ReadyForPickupTicket, ticketsApi } from '../lib/api';
import { useCreatePaymentMutation } from '../hooks/useTicketsQuery';
import { useAppStore } from '../store/useAppStore';
import { TableRowSkeleton } from '../components/Skeleton';

const money = (value: string | number | null | undefined) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function ReadyForPickupPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data: tickets = [], isLoading } = useQuery<ReadyForPickupTicket[]>({
    queryKey: ['ready-for-pickup'],
    queryFn: ticketsApi.readyForPickup,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tickets;
    return tickets.filter((ticket) =>
      [
        ticket.id,
        ticket.ticketNumber,
        ticket.jobNumber,
        ticket.customer?.name,
        ticket.customer?.phone,
        ticket.brand,
        ticket.model,
        ticket.serialNumber,
        ticket.title,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [tickets, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#162d3d] tracking-tight flex items-baseline gap-2.5">
            Ready for Pickup
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {tickets.length} awaiting pickup
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Invoiced repairs awaiting customer pickup.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-3 px-4 border-b border-[#e2e8f0]">
          <div className="flex justify-end">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#116dff]" />
              <input
                type="text"
                placeholder="Search by ticket #, job #, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 md:w-64 h-9 bg-white border border-[#e2e8f0] rounded-full pl-9 pr-4 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Table Layout */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] uppercase tracking-wider font-semibold whitespace-nowrap">
                <th className="py-3.5 px-5">Ticket / Job No</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Device Details</th>
                <th className="py-3.5 px-5">Total Billed</th>
                <th className="py-3.5 px-5">Invoice</th>
                <th className="py-3.5 px-5">Payment</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-[#334155]">
              {isLoading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <img
                        src="/empty-ready-pickup.png"
                        alt="No pickups ready"
                        className="w-64 max-w-full h-auto object-contain opacity-90"
                      />
                      <div className="text-base font-bold text-[#1e293b] tracking-tight">
                        No pickups ready
                      </div>
                      <div className="text-xs text-[#64748B] max-w-[320px]">
                        No repairs are currently awaiting customer collection.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => {
                  const invoice = ticket.invoice;
                  const paymentStatus = invoice?.paymentStatus || ticket.paymentStatus || 'UNPAID';
                  const isPaid = paymentStatus === 'PAID';

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8fafc] transition-colors group whitespace-nowrap cursor-pointer"
                    >
                      {/* Ticket No */}
                      <td className="py-4 px-5 font-mono text-sm text-[#116dff] font-semibold group-hover:underline">
                        {ticket.ticketNumber || ticket.jobNumber}
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-[#1e293b] text-sm font-semibold">
                            {ticket.customer?.name || 'Walk-in Customer'}
                          </span>
                          <span className="text-xs text-[#64748B] mt-0.5 font-mono">
                            {ticket.customer?.phone || 'No phone'}
                          </span>
                        </div>
                      </td>

                      {/* Device Details */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-[#1e293b] text-sm font-semibold">
                            {[ticket.brand, ticket.model].filter(Boolean).join(' ') || ticket.title}
                          </span>
                          <span
                            className="text-xs text-[#64748B] truncate max-w-[240px] mt-0.5"
                            title={ticket.reportedIssue || ticket.description}
                          >
                            {ticket.reportedIssue || ticket.description}
                          </span>
                        </div>
                      </td>

                      {/* Total Billed */}
                      <td className="py-4 px-5 font-mono text-sm font-semibold text-[#1e293b]">
                        {money(invoice?.total ?? ticket.totalAmount)}
                      </td>

                      {/* Invoice Status */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Issued
                          </span>
                          {invoice?.invoiceNumber && (
                            <span className="text-[11px] font-mono text-[#64748B] mt-1">
                              {invoice.invoiceNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="py-4 px-5">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {paymentStatus === 'PARTIALLY_PAID' || paymentStatus === 'PARTIAL'
                              ? 'Partial'
                              : 'Unpaid'}
                          </span>
                        )}
                      </td>

                      {/* Action Button: Checkout */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/tickets/${ticket.id}/billing`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#116dff] text-white hover:bg-[#005be3] transition-all shadow-xs cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Checkout</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
