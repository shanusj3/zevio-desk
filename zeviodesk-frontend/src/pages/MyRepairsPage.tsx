import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wrench, CheckCircle2, Search, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Ticket, ticketsApi } from '../lib/api';
import { useCompleteRepairMutation } from '../hooks/useTicketsQuery';
import { navigate } from '../lib/navigation';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TableRowSkeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';

export function MyRepairsPage() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [search, setSearch] = useState('');
  const [confirmTicket, setConfirmTicket] = useState<Ticket | null>(null);

  // Fetch tickets assigned to technician
  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', { assignedToMe: true }],
    queryFn: () => ticketsApi.fetchAll(),
  });

  const completeRepairMutation = useCompleteRepairMutation();

  const activeRepairs = useMemo(
    () => tickets.filter((t) => ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS'].includes(t.status)),
    [tickets]
  );

  const completedRepairs = useMemo(
    () => tickets.filter((t) => t.status === 'REPAIR_COMPLETED'),
    [tickets]
  );

  const currentList = activeTab === 'ACTIVE' ? activeRepairs : completedRepairs;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return currentList;
    return currentList.filter((ticket) =>
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
  }, [currentList, search]);

  const handleConfirmComplete = async () => {
    if (!confirmTicket) return;
    try {
      await completeRepairMutation.mutateAsync(confirmTicket.id);
      setConfirmTicket(null);
    } catch (err) {
      console.error('Failed to complete repair:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Workspace Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#162d3d] tracking-tight flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-[#116dff]" />
            My Repairs
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Technician workspace — manage assigned repair jobs and technical completions.
          </p>
        </div>
      </div>

      {/* Workspace Controls & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'ACTIVE'
                ? 'bg-[#116dff] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#1e293b] border border-[#e2e8f0]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Repairs</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748B]'
            }`}>
              {activeRepairs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'COMPLETED'
                ? 'bg-[#116dff] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#1e293b] border border-[#e2e8f0]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Recently Completed (Read Only)</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748B]'
            }`}>
              {completedRepairs.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#116dff]" />
          <input
            type="text"
            placeholder="Search my repairs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 md:w-64 h-9 bg-white border border-[#e2e8f0] rounded-full pl-9 pr-4 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] transition-colors"
          />
        </div>
      </div>

      {/* Main Content Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] uppercase tracking-wider font-semibold whitespace-nowrap">
                <th className="py-3.5 px-5">Ticket / Job No</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Device Details</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Action / Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-[#334155]">
              {isLoading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={5} />
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-[#116dff] flex items-center justify-center">
                        <Wrench className="w-6 h-6" />
                      </div>
                      <div className="text-base font-bold text-[#1e293b] tracking-tight">
                        {activeTab === 'ACTIVE' ? 'No active repair jobs' : 'No recently completed repairs'}
                      </div>
                      <div className="text-xs text-[#64748B] max-w-[300px]">
                        {activeTab === 'ACTIVE'
                          ? 'You currently have no repair tasks assigned to you.'
                          : 'You have not completed any repairs in this session.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => {
                  const isCompletedTab = activeTab === 'COMPLETED';

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

                      {/* Status */}
                      <td className="py-4 px-5">
                        <StatusBadge status={ticket.status} />
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        {isCompletedTab ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>✓ Repair Completed (Awaiting Invoice)</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/tickets/${ticket.id}`)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                            >
                              View Details
                            </button>

                            <button
                              onClick={() => setConfirmTicket(ticket)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#116dff] text-white hover:bg-[#005be3] transition-colors shadow-sm cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete Repair</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmTicket && (
        <ConfirmationModal
          isOpen={!!confirmTicket}
          title="Complete Repair"
          message={`Are you sure technical work on ticket (${confirmTicket.ticketNumber || confirmTicket.jobNumber}) is finished? This will move the repair to the administrative queue for invoice processing.`}
          confirmText="Complete Repair"
          cancelText="Cancel"
          type="info"
          isLoading={completeRepairMutation.isPending}
          onConfirm={handleConfirmComplete}
          onCancel={() => setConfirmTicket(null)}
        />
      )}
    </div>
  );
}
