import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  Loader2,
  Ticket as TicketIcon,
  AlertTriangle,
  User,
  Clock,
} from 'lucide-react';
import { Ticket } from '../lib/api';
import { useTicketsQuery } from '../hooks/useTicketsQuery';
import { TableRowSkeleton } from './Skeleton';
import { useAppStore } from '../store/useAppStore';
import { getStatusLabel, getStatusBadge } from '../lib/ticketDisplay';

interface TicketsTableProps {
  onSelectTicket: (ticket: Ticket) => void;
  onEditTicket?: (ticket: Ticket) => void;
  onDeleteTicket?: (ticket: Ticket) => void;
  // If provided, use these tickets directly (from parent with date filter applied)
  filteredTickets?: Ticket[];
}

export const TicketsTable: React.FC<TicketsTableProps> = ({
  onSelectTicket,
  onEditTicket,
  onDeleteTicket,
  filteredTickets: parentFilteredTickets,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'RECEIVED' | 'DIAGNOSING' | 'WAITING_FOR_PARTS' | 'IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'NORMAL' | 'URGENT' | 'WARRANTY'>('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  const { currentUser } = useAppStore();
  const { data: allTickets = [], isLoading, isFetching } = useTicketsQuery();

  // If parent passes filteredTickets (dashboard), use those. Otherwise show all tickets from API.
  const baseTickets = parentFilteredTickets !== undefined ? parentFilteredTickets : allTickets;

  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and search logic
  const filteredTickets = baseTickets.filter((ticket) => {
    // Search filter
    const searchLower = searchInput.toLowerCase();
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchLower) ||
      ticket.description.toLowerCase().includes(searchLower) ||
      (ticket.customer?.name || '').toLowerCase().includes(searchLower) ||
      (ticket.assignedTo?.name || '').toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;

    // Priority filter
    const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-[#7F1D1D]/80 text-[#F87171] border border-[#DC2626]/30';
      case 'WARRANTY':
        return 'bg-[#1E3A8A]/80 text-[#93C5FD] border border-[#2563EB]/30';
      case 'NORMAL':
        return 'bg-[#78350F]/80 text-[#FCD34D] border border-[#D97706]/30';
      default:
        return 'bg-[#1e293b] text-[#94a3b8]';
    }
  };

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-[#1E3A8A]/80 text-[#93C5FD] border border-[#2563EB]/30';
      case 'DIAGNOSING':
        return 'bg-[#4C1D95]/80 text-[#C4B5FD] border border-[#7C3AED]/30';
      case 'WAITING_FOR_PARTS':
        return 'bg-[#78350F]/80 text-[#FCD34D] border border-[#D97706]/30';
      case 'IN_PROGRESS':
        return 'bg-[#854D0E]/80 text-[#FDE68A] border border-[#CA8A04]/30';
      case 'READY_FOR_PICKUP':
        return 'bg-[#14532D]/80 text-[#86EFAC] border border-[#16A34A]/30';
      case 'COMPLETED':
        return 'bg-[#064E3B]/80 text-[#34D399] border border-[#059669]/30';
      case 'CANCELLED':
        return 'bg-[#1e293b]/80 text-[#94a3b8] border border-[#334155]/30';
      default:
        return 'bg-[#1e293b] text-[#94a3b8]';
    }
  };

  return (
    <div className="bg-[#101622] border border-[#1b2536] rounded-lg shadow-xl overflow-hidden">
      {/* Top Header Controls Bar */}
      <div className="p-5 border-b border-[#1b2536] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Support Tickets
          </h3>

          {/* Search Input & Filter Dropdown */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input Box */}
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 bg-[#162030] border border-[#22314a] rounded-lg pl-10 pr-4 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#D99B26] transition-colors"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`px-4 h-11 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-colors ${
                  statusFilter !== 'All' || priorityFilter !== 'All'
                    ? 'bg-[#D99B26]/20 text-[#D99B26] border-[#D99B26]/40'
                    : 'bg-[#162030] text-[#94A3B8] hover:text-white border-[#22314a]'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
                {(statusFilter !== 'All' || priorityFilter !== 'All') && (
                  <span className="bg-[#D99B26] text-[#0d121c] font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {(statusFilter !== 'All' ? 1 : 0) + (priorityFilter !== 'All' ? 1 : 0)}
                  </span>
                )}
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#121824] border border-[#22314a] rounded-xl shadow-2xl z-40 p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[60vh] overflow-y-auto">
                  {/* Status Group — Active */}
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#475569] px-1 pb-0.5 border-b border-[#1e293b]">
                      Active
                    </div>
                    {([
                      { value: 'All', label: 'All Active' },
                      { value: 'RECEIVED', label: 'New' },
                      { value: 'DIAGNOSING', label: 'Diagnosis' },
                      { value: 'WAITING_FOR_PARTS', label: 'Waiting for Parts' },
                      { value: 'IN_PROGRESS', label: 'Repair in Progress' },
                      { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
                    ] as const).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setStatusFilter(value as typeof statusFilter)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-[11px] rounded-lg transition-colors ${
                          statusFilter === value
                            ? 'bg-[#D99B26]/15 text-[#D99B26] font-semibold'
                            : 'text-[#94A3B8] hover:text-white hover:bg-[#182030]'
                        }`}
                      >
                        <span>{label}</span>
                        {statusFilter === value && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>

                  {/* Status Group — Closed */}
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#475569] px-1 pb-0.5 border-b border-[#1e293b]">
                      Closed
                    </div>
                    {([
                      { value: 'COMPLETED', label: 'Delivered' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                    ] as const).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setStatusFilter(value as typeof statusFilter)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-[11px] rounded-lg transition-colors ${
                          statusFilter === value
                            ? 'bg-[#D99B26]/15 text-[#D99B26] font-semibold'
                            : 'text-[#94A3B8] hover:text-white hover:bg-[#182030]'
                        }`}
                      >
                        <span>{label}</span>
                        {statusFilter === value && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-[#22314a]" />

                  {/* Priority Group */}
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#475569] px-1 pb-0.5 border-b border-[#1e293b]">
                      Priority
                    </div>
                    {(['All', 'NORMAL', 'URGENT', 'WARRANTY'] as const).map((pr) => (
                      <button
                        key={pr}
                        onClick={() => setPriorityFilter(pr)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-[11px] rounded-lg transition-colors ${
                          priorityFilter === pr
                            ? 'bg-[#D99B26]/15 text-[#D99B26] font-semibold'
                            : 'text-[#94A3B8] hover:text-white hover:bg-[#182030]'
                        }`}
                      >
                        <span>{pr === 'All' ? 'All Priorities' : pr.charAt(0) + pr.slice(1).toLowerCase()}</span>
                        {priorityFilter === pr && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left text-xs min-w-[850px]">
          <thead>
            <tr className="border-b border-[#1b2536] bg-[#0c111a]/60 text-[#64748B] uppercase tracking-wider font-semibold whitespace-nowrap">
              <th className="py-3.5 px-5 min-w-[220px]">Ticket Details</th>
              <th className="py-3.5 px-5 min-w-[150px]">Customer</th>
              <th className="py-3.5 px-5 min-w-[140px]">Assignee</th>
              <th className="py-3.5 px-5 min-w-[100px]">Priority</th>
              <th className="py-3.5 px-5 min-w-[110px]">Status</th>
              <th className="py-3.5 px-5 min-w-[120px]">Created At</th>
              <th className="py-3.5 px-5 text-right min-w-[110px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2536]/80 text-[#CBD5E1]">
            {isLoading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={7} />
                ))}
              </>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-[#162030] rounded-full flex items-center justify-center border border-[#22314a] shadow-inner">
                      <TicketIcon className="w-8 h-8 text-[#D99B26]" />
                    </div>
                    <div className="text-sm font-medium text-[#E2E8F0]">
                      No tickets found
                    </div>
                    <div className="text-xs text-[#64748B] max-w-[250px]">
                      We couldn't find any tickets matching your search or filter criteria.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-[#151d2d]/80 transition-colors group whitespace-nowrap"
                >
                  {/* Ticket Details */}
                  <td className="py-3.5 px-5 font-semibold text-white">
                    <div className="flex flex-col min-w-0">
                      <span className="truncate max-w-[200px] text-white text-xs font-semibold" title={ticket.title}>
                        {ticket.title}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-normal truncate max-w-[200px] mt-0.5">
                        {ticket.description}
                      </span>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-5 text-[#E2E8F0] font-medium">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[140px]" title={ticket.customer?.name || 'Walk-in'}>
                        {ticket.customer?.name || 'Walk-in Customer'}
                      </span>
                      {ticket.customer?.phone && (
                        <span className="text-[10px] text-[#64748B] font-normal font-mono mt-0.5">
                          {ticket.customer.phone}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-5 text-[#94A3B8] font-normal">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#64748B]" />
                      <span className="truncate max-w-[120px]" title={ticket.assignedTo?.name || 'Unassigned'}>
                        {ticket.assignedTo?.name || 'Unassigned'}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>

                  {/* Status Pill */}
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadge(ticket.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {getStatusLabel(ticket.status)}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="py-3.5 px-5 text-[#94A3B8] font-mono text-[11px]">
                    {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right relative">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Details Eye Icon */}
                      <button
                        onClick={() => onSelectTicket(ticket)}
                        className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1e2a40] rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* More Menu Toggle */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveActionMenuId(
                              activeActionMenuId === ticket.id ? null : ticket.id
                            )
                          }
                          className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1e2a40] rounded-lg transition-colors"
                          title="More Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeActionMenuId === ticket.id && (
                          <div
                            className="absolute right-0 mt-1 w-40 bg-[#121824] border border-[#23314a] rounded-lg shadow-2xl z-50 p-1.5 text-left animate-in fade-in zoom-in-95"
                            onMouseLeave={() => setActiveActionMenuId(null)}
                          >
                            <button
                              onClick={() => {
                                onSelectTicket(ticket);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#94A3B8] hover:text-white hover:bg-[#1c263a] rounded-md transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details
                            </button>
                            {onEditTicket && (
                              <button
                                onClick={() => {
                                  onEditTicket(ticket);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#94A3B8] hover:text-white hover:bg-[#1c263a] rounded-md transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit Ticket
                              </button>
                            )}
                            {onDeleteTicket && (
                              <>
                                <div className="my-1 border-t border-[#23314a]" />
                                <button
                                  onClick={() => {
                                    onDeleteTicket(ticket);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete Ticket
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#1b2536] flex items-center justify-between text-xs text-[#64748B]">
        <div>
          Showing{' '}
          <span className="font-semibold text-white">
            {filteredTickets.length}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-white">
            {baseTickets.length}
          </span>{' '}
          tickets
        </div>
      </div>
    </div>
  );
};
