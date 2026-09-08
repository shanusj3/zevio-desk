import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, Wrench, ArrowRight } from 'lucide-react';
import { ReadyForPickupTicket, ticketsApi } from '../lib/api';
import { navigate, ticketBillingPath } from '../lib/navigation';
import { TableRowSkeleton } from '../components/Skeleton';
import { formatCurrency } from '../utils/formatters';

const money = (value: string | number | null | undefined) =>
  formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function RepairCompletedPage() {
  const [search, setSearch] = useState('');
  const { data: tickets = [], isLoading } = useQuery<ReadyForPickupTicket[]>({
    queryKey: ['repair-completed'],
    queryFn: ticketsApi.repairCompleted,
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
        ticket.assignedTo?.name,
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
            Repair Completed
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {tickets.length} awaiting invoicing
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Repairs completed by technicians and awaiting invoicing.
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
                placeholder="Search by ticket #, job #, tech, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 md:w-72 h-9 bg-white border border-[#e2e8f0] rounded-full pl-9 pr-4 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] transition-colors"
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
                <th className="py-3.5 px-5">Technician</th>
                <th className="py-3.5 px-5">Total</th>
                <th className="py-3.5 px-5">Invoice Status</th>
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
                        src="/empty-tickets.png"
                        alt="No completed repairs awaiting invoicing"
                        className="w-64 max-w-full h-auto object-contain opacity-90"
                      />
                      <div className="text-base font-bold text-[#1e293b] tracking-tight">
                        No completed repairs awaiting invoicing
                      </div>
                      <div className="text-xs text-[#64748B] max-w-[320px]">
                        All technician-completed repairs have been processed into invoices.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => {
                  const invoice = ticket.invoice;
                  const totalFormatted = money(ticket.totalAmount || invoice?.total || 0);

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

                      {/* Technician */}
                      <td className="py-4 px-5">
                        <span className="text-[#1e293b] font-medium">
                          {ticket.assignedTo?.name || 'Unassigned'}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-5 font-mono font-semibold text-[#1e293b]">
                        {totalFormatted}
                      </td>

                      {/* Invoice Status */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Not Generated
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(ticketBillingPath(ticket.id))}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#116dff] text-white hover:bg-[#005be3] transition-colors shadow-sm cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Generate Invoice</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
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
