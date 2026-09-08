import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Ticket as TicketIcon,
  User,
  Upload,
  SlidersHorizontal,
  GripVertical,
  Loader2,
} from 'lucide-react';

import { Ticket, FetchTicketsParams, reportsApi } from '../lib/api';
import { useInfiniteTicketsQuery } from '../hooks/useTicketsQuery';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TableRowSkeleton } from './Skeleton';
import { useAppStore } from '../store/useAppStore';
import { getStatusLabel, getStatusBadge, getPriorityBadge, getPriorityTextStyle, getWarrantyDisplay, formatDeviceTitle } from '../lib/ticketDisplay';
import { StatusBadge } from './StatusBadge';
import { SearchInput } from './ui/SearchInput';

import { useDebouncedValue } from '../hooks/useDebouncedValue';

interface TicketsTableProps {
  isHeaderOut?: boolean;
  onSelectTicket: (ticket: Ticket) => void;
  onEditTicket?: (ticket: Ticket) => void;
  onDeleteTicket?: (ticket: Ticket) => void;
  filteredTickets?: Ticket[];
  onTotalCountChange?: (count: number) => void;
  onFilteredCountChange?: (count: number) => void;
  onFiltersChange?: (filters: FetchTicketsParams) => void;
  onExportClick?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Status' },
  { value: 'RECEIVED', label: 'New' },
  { value: 'DIAGNOSING', label: 'Diagnosis' },
  { value: 'WAITING_FOR_PARTS', label: 'Waiting for Parts' },
  { value: 'IN_PROGRESS', label: 'Repair in Progress' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { value: 'COMPLETED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const PRIORITIES = ['All', 'NORMAL', 'URGENT'] as const;

const DATE_PRESETS = ['All Time', 'Today', 'This Week', 'This Month', 'Custom Range'] as const;

type StatusFilter =
  | 'All'
  | 'RECEIVED'
  | 'DIAGNOSING'
  | 'WAITING_FOR_PARTS'
  | 'IN_PROGRESS'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED';

type PriorityFilter = 'All' | 'NORMAL' | 'URGENT';

export const TicketsTable: React.FC<TicketsTableProps> = ({
  isHeaderOut = false,
  onSelectTicket,
  onEditTicket,
  onDeleteTicket,
  onTotalCountChange,
  onFilteredCountChange,
  onFiltersChange,
  onExportClick,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useAppStore();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('All');
  const [datePreset, setDatePreset] = useState<string>('All Time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [isFilterDrawerMounted, setIsFilterDrawerMounted] = useState(false);
  const [isFilterDrawerVisible, setIsFilterDrawerVisible] = useState(false);
  const [isCustomizationMounted, setIsCustomizationMounted] = useState(false);
  const [isCustomizationVisible, setIsCustomizationVisible] = useState(false);

  const [statusSectionOpen, setStatusSectionOpen] = useState(true);
  const [prioritySectionOpen, setPrioritySectionOpen] = useState(true);
  const [dateSectionOpen, setDateSectionOpen] = useState(true);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Column preferences
  const [visibleColumns, setVisibleColumns] = useState({
    ticketDetails: true, // Mandatory
    customer: true,
    assignee: true,
    priority: true,
    warranty: true,
    status: true,
    createdAt: true,
  });

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'ticketDetails',
    'customer',
    'assignee',
    'priority',
    'warranty',
    'status',
    'createdAt',
  ]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [colSearch, setColSearch] = useState('');

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fetch DB Preferences to restore table column preferences
  const { data: dbPreferences } = useQuery({
    queryKey: ['dashboard-preferences'],
    queryFn: reportsApi.getPreferences,
  });

  useEffect(() => {
    if (dbPreferences?.statOrder && (dbPreferences.statOrder as any).tickets) {
      const saved = (dbPreferences.statOrder as any).tickets;
      if (saved.visibleColumnIds) setVisibleColumns(saved.visibleColumnIds);
      if (saved.columnOrder) setColumnOrder(saved.columnOrder);
    }
  }, [dbPreferences]);

  // Calculate startDate & endDate from presets
  const getDateRange = () => {
    const now = new Date();
    if (datePreset === 'Today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
      return { startDate: start, endDate: end };
    }
    if (datePreset === 'This Week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { startDate: d.toISOString(), endDate: now.toISOString() };
    }
    if (datePreset === 'This Month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { startDate: start, endDate: now.toISOString() };
    }
    if (datePreset === 'Custom Range' && (customStartDate || customEndDate)) {
      return {
        startDate: customStartDate ? new Date(customStartDate).toISOString() : undefined,
        endDate: customEndDate ? new Date(customEndDate + 'T23:59:59').toISOString() : undefined,
      };
    }
    return { startDate: undefined, endDate: undefined };
  };

  const { startDate, endDate } = getDateRange();

  const queryParams: Omit<FetchTicketsParams, 'page'> = {
    status: statusFilter,
    priority: priorityFilter,
    search: debouncedSearch,
    startDate,
    endDate,
  };

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteTicketsQuery(queryParams);

  const tickets = infiniteData ? infiniteData.pages.flatMap((page) => page.tickets) : [];
  const totalCount = infiniteData?.pages[0]?.total ?? 0;

  // Sync counts & filters to parent
  useEffect(() => {
    onTotalCountChange?.(totalCount);
    onFilteredCountChange?.(totalCount);
  }, [totalCount, onTotalCountChange, onFilteredCountChange]);

  useEffect(() => {
    onFiltersChange?.({
      status: statusFilter,
      priority: priorityFilter,
      search: debouncedSearch,
      startDate,
      endDate,
    });
  }, [statusFilter, priorityFilter, debouncedSearch, startDate, endDate, onFiltersChange]);

  // True Infinite Scroll via IntersectionObserver with 300px rootMargin
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const custCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openFilterDrawer = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsFilterDrawerMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsFilterDrawerVisible(true));
    });
  };

  const closeFilterDrawer = () => {
    setIsFilterDrawerVisible(false);
    closeTimeoutRef.current = setTimeout(() => setIsFilterDrawerMounted(false), 250);
  };

  const openCustomization = () => {
    if (custCloseTimeoutRef.current) clearTimeout(custCloseTimeoutRef.current);
    setIsCustomizationMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsCustomizationVisible(true));
    });
  };

  const closeCustomization = () => {
    setIsCustomizationVisible(false);
    custCloseTimeoutRef.current = setTimeout(() => setIsCustomizationMounted(false), 250);
  };

  const handleApplyColumnPreferences = async () => {
    try {
      await reportsApi.updateTablePreferences('tickets', visibleColumns, columnOrder);
      queryClient.invalidateQueries({ queryKey: ['dashboard-preferences'] });
      showToast('Table column layout saved to database', 'success');
    } catch (err: any) {
      showToast('Failed to save table columns to database', 'warning');
    }
    closeCustomization();
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null) return;
    const items = Array.from(columnOrder);
    const [reorderedItem] = items.splice(draggedIndex, 1);
    items.splice(index, 0, reorderedItem);
    setColumnOrder(items);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const activeFilterCount =
    (statusFilter !== 'All' ? 1 : 0) +
    (priorityFilter !== 'All' ? 1 : 0) +
    (datePreset !== 'All Time' ? 1 : 0);

  const hasFilters = activeFilterCount > 0;

  const activeColCount =
    2 +
    (visibleColumns.customer ? 1 : 0) +
    (visibleColumns.assignee ? 1 : 0) +
    (visibleColumns.priority ? 1 : 0) +
    (visibleColumns.status ? 1 : 0) +
    (visibleColumns.createdAt ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setDatePreset('All Time');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchInput('');
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-[#7F1D1D] text-[#fee2e2] border border-[#DC2626]/40';
      case 'NORMAL':
      default:
        return 'bg-[#78350F] text-[#ffedd5] border border-[#D97706]/40';
    }
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
      {/* Top Controls Header Bar */}
      <div className="p-3 px-4 border-b border-[#e2e8f0]">
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-3">
          {/* Right Side: Filters, Search, CSV Export, Customize Columns */}
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap w-full md:w-auto">
            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={openFilterDrawer}
                className={`px-4 h-9 rounded-full text-sm font-medium flex items-center gap-2 border transition-all cursor-pointer bg-white text-primary hover:bg-primary hover:text-white hover:border-primary ${
                  hasFilters ? 'border-primary/40 bg-primary/10' : 'border-[#e2e8f0]'
                }`}
              >
                <Filter className="w-4 h-4 animate-in fade-in" />
                <span>Filter</span>
              </button>
              {hasFilters && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white font-semibold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-sm pointer-events-none animate-in scale-in duration-150">
                  {activeFilterCount}
                </span>
              )}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={onExportClick}
              className="w-9 h-9 flex items-center justify-center border border-[#e2e8f0] hover:border-primary rounded-full hover:bg-primary hover:text-white transition-all text-primary cursor-pointer"
              title="Export CSV"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Customize Columns Button */}
            <button
              onClick={openCustomization}
              className="w-9 h-9 flex items-center justify-center border border-[#e2e8f0] hover:border-primary rounded-full hover:bg-primary hover:text-white transition-all text-primary cursor-pointer"
              title="Customize Columns"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Backend Search Input */}
            <SearchInput
              variant="pill"
              size="sm"
              containerClassName="flex-1 md:w-80"
              placeholder="Search by ticket #, job #, phone, device model..."
              value={searchInput}
              onChange={setSearchInput}
            />
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      {isFilterDrawerMounted && (
        <div className="fixed inset-0 top-12 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30 transition-opacity duration-200 ease-out"
            style={{ opacity: isFilterDrawerVisible ? 1 : 0 }}
            onClick={closeFilterDrawer}
          />

          <div
            className="relative w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col transition-transform duration-200 ease-out z-10"
            style={{
              transform: isFilterDrawerVisible ? 'translateX(0)' : 'translateX(100%)',
            }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-base font-semibold text-[#1e293b]">Filter tickets</h2>
              <button
                onClick={closeFilterDrawer}
                className="p-1.5 text-[#64748B] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Status Section */}
              <div>
                <button
                  onClick={() => setStatusSectionOpen(!statusSectionOpen)}
                  className="w-full px-6 flex items-center justify-between py-3.5 hover:bg-[#f8fafc] transition-colors"
                >
                  <span className="text-sm font-semibold text-[#1e293b]">Status</span>
                  <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${statusSectionOpen ? '' : '-rotate-90'}`} />
                </button>
                {statusSectionOpen && (
                  <div className="px-6 py-2 space-y-1">
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2.5 px-1 py-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="status"
                          className="hidden"
                          checked={statusFilter === value}
                          onChange={() => setStatusFilter(value as StatusFilter)}
                        />
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${statusFilter === value ? 'border-[#116dff]' : 'border-[#cbd5e1]'}`}>
                          {statusFilter === value && <span className="w-2 h-2 rounded-full bg-[#116dff]" />}
                        </span>
                        <span className={`text-[13px] ${statusFilter === value ? 'text-[#116dff] font-semibold' : 'text-[#334155]'}`}>{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority Section */}
              <div className="border-t border-[#e2e8f0]">
                <button
                  onClick={() => setPrioritySectionOpen(!prioritySectionOpen)}
                  className="w-full px-6 flex items-center justify-between py-3.5 hover:bg-[#f8fafc] transition-colors"
                >
                  <span className="text-sm font-semibold text-[#1e293b]">Priority</span>
                  <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${prioritySectionOpen ? '' : '-rotate-90'}`} />
                </button>
                {prioritySectionOpen && (
                  <div className="px-6 py-2 space-y-1">
                    {PRIORITIES.map((pr) => (
                      <label key={pr} className="flex items-center gap-2.5 px-1 py-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="priority"
                          className="hidden"
                          checked={priorityFilter === pr}
                          onChange={() => setPriorityFilter(pr)}
                        />
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${priorityFilter === pr ? 'border-[#116dff]' : 'border-[#cbd5e1]'}`}>
                          {priorityFilter === pr && <span className="w-2 h-2 rounded-full bg-[#116dff]" />}
                        </span>
                        <span className={`text-[13px] ${priorityFilter === pr ? 'text-[#116dff] font-semibold' : 'text-[#334155]'}`}>
                          {pr === 'All' ? 'All Priorities' : pr.charAt(0) + pr.slice(1).toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Filter Section */}
              <div className="border-t border-[#e2e8f0]">
                <button
                  onClick={() => setDateSectionOpen(!dateSectionOpen)}
                  className="w-full px-6 flex items-center justify-between py-3.5 hover:bg-[#f8fafc] transition-colors"
                >
                  <span className="text-sm font-semibold text-[#1e293b]">Date Range</span>
                  <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${dateSectionOpen ? '' : '-rotate-90'}`} />
                </button>
                {dateSectionOpen && (
                  <div className="px-6 py-2 space-y-1">
                    {DATE_PRESETS.map((preset) => (
                      <label key={preset} className="flex items-center gap-2.5 px-1 py-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="datePreset"
                          className="hidden"
                          checked={datePreset === preset}
                          onChange={() => setDatePreset(preset)}
                        />
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${datePreset === preset ? 'border-[#116dff]' : 'border-[#cbd5e1]'}`}>
                          {datePreset === preset && <span className="w-2 h-2 rounded-full bg-[#116dff]" />}
                        </span>
                        <span className={`text-[13px] ${datePreset === preset ? 'text-[#116dff] font-semibold' : 'text-[#334155]'}`}>{preset}</span>
                      </label>
                    ))}

                    {datePreset === 'Custom Range' && (
                      <div className="pt-2 pb-3 space-y-2">
                        <div>
                          <label className="text-[11px] font-medium text-[#64748B] block mb-1">From Date</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full h-8 border border-[#e2e8f0] rounded-lg px-2.5 text-xs text-[#1e293b]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[#64748B] block mb-1">To Date</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full h-8 border border-[#e2e8f0] rounded-lg px-2.5 text-xs text-[#1e293b]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0]">
              <span className="text-[13px] font-medium text-[#64748B]">
                {hasFilters ? `${activeFilterCount} filter(s) applied` : 'No filters applied'}
              </span>
              <button
                onClick={clearAllFilters}
                disabled={!hasFilters}
                className={`text-[13px] font-semibold ${hasFilters ? 'text-[#116dff] hover:underline cursor-pointer' : 'text-[#94a3b8] cursor-not-allowed'}`}
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Columns Drawer */}
      {isCustomizationMounted && (
        <div className="fixed inset-0 top-12 z-40 flex justify-end animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/30 transition-opacity duration-200 ease-out"
            style={{ opacity: isCustomizationVisible ? 1 : 0 }}
            onClick={closeCustomization}
          />

          <div
            className="relative w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col transition-transform duration-200 ease-out z-10"
            style={{ transform: isCustomizationVisible ? 'translateX(0)' : 'translateX(100%)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
              <h2 className="text-base font-semibold text-[#1e293b]">Customize columns</h2>
              <button onClick={closeCustomization} className="p-1 text-[#64748B] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-xs text-[#64748B]">Select which columns to show, or drag them into a different order.</p>

              <div className="relative my-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search columns..."
                  value={colSearch}
                  onChange={(e) => setColSearch(e.target.value)}
                  className="w-full h-9 bg-white border border-[#e2e8f0] rounded-full pl-9 pr-4 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff]"
                />
              </div>

              <div className="divide-y divide-[#e2e8f0] border border-[#e2e8f0] rounded-xl overflow-hidden mt-4">
                {columnOrder.map((colId, idx) => {
                  const isMandatory = colId === 'ticketDetails';
                  const isVisible = visibleColumns[colId as keyof typeof visibleColumns];
                  let label = '';
                  switch (colId) {
                    case 'ticketDetails': label = 'Ticket Details'; break;
                    case 'customer': label = 'Customer'; break;
                    case 'assignee': label = 'Assignee'; break;
                    case 'priority': label = 'Priority'; break;
                    case 'status': label = 'Status'; break;
                    case 'createdAt': label = 'Created At'; break;
                  }

                  if (colSearch && !label.toLowerCase().includes(colSearch.toLowerCase())) {
                    return null;
                  }

                  return (
                    <div
                      key={colId}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      className={`flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing select-none ${
                        dragOverIndex === idx ? 'border-t-2 border-t-[#116dff]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-[#cbd5e1] shrink-0 cursor-grab" />
                        <input
                          type="checkbox"
                          checked={isVisible}
                          disabled={isMandatory}
                          onChange={(e) => setVisibleColumns({ ...visibleColumns, [colId]: e.target.checked })}
                          className="w-4 h-4 rounded text-[#116dff] accent-[#116dff] cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="text-sm font-semibold text-[#1e293b]">{label}</span>
                      </div>
                      {isMandatory && (
                        <span className="text-[10px] bg-[#e2e8f0] text-[#64748B] px-2 py-0.5 rounded font-medium">Mandatory</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-[#e2e8f0] flex justify-end">
              <button
                onClick={handleApplyColumnPreferences}
                className="px-6 h-10 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-semibold rounded-full text-sm transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Table Section */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left text-xs min-w-[850px] border-collapse">
          <thead className="bg-[#f8fafc]">
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] uppercase tracking-wider font-semibold whitespace-nowrap">
              {columnOrder.map((colId) => {
                if (colId === 'ticketDetails' && visibleColumns.ticketDetails) {
                  return <th key={colId} className="bg-[#f8fafc] py-3.5 px-5 min-w-[220px]">Ticket Details</th>;
                }
                if (colId === 'customer' && visibleColumns.customer) {
                  return <th key={colId} className="bg-[#f8fafc] py-3.5 px-5 min-w-[150px]">Customer</th>;
                }
                if (colId === 'assignee' && visibleColumns.assignee) {
                  return <th key={colId} className="bg-[#f8fafc] py-3.5 px-5 min-w-[140px]">Assignee</th>;
                }
                if (colId === 'priority' && visibleColumns.priority) {
                  return <th key={colId} className="bg-[#f8fafc] py-3.5 px-5 min-w-[100px]">Priority</th>;
                }
                if (colId === 'warranty' && (visibleColumns as any).warranty) {
                  return <th key={colId} className="bg-[#f8fafc] py-3.5 px-5 min-w-[110px]">Warranty</th>;
                }
                if (colId === 'status' && visibleColumns.status) {
                  return <th key={colId} className="bg-[#f8fafc] py-3.5 px-5 min-w-[110px]">Status</th>;
                }
                if (colId === 'createdAt' && visibleColumns.createdAt) {
                  return <th key={colId} className="bg-[#f8fafc] py-3.5 px-5 min-w-[120px]">Created At</th>;
                }
                return null;
              })}
              <th className="bg-[#f8fafc] py-3.5 px-5 text-right min-w-[110px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0] text-[#334155]">
            {isLoading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={activeColCount} />
                ))}
              </>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={activeColCount} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    {statusFilter === 'READY_FOR_PICKUP' || window.location.pathname.includes('ready-for-pickup') ? (
                      <>
                        <img
                          src="/empty-ready-pickup.png"
                          alt="No items ready for pickup"
                          className="w-64 max-w-full h-auto object-contain opacity-90"
                        />
                        <div className="text-sm font-bold text-[#1e293b] tracking-tight">No items ready for pickup</div>
                        <div className="text-xs text-[#64748B] max-w-[280px]">
                          There are currently no repair tickets waiting for customer pickup.
                        </div>
                      </>
                    ) : (
                      <>
                        <img
                          src="/empty-tickets.png"
                          alt="No tickets found"
                          className="w-64 max-w-full h-auto object-contain opacity-90"
                        />
                        <div className="text-sm font-bold text-[#1e293b] tracking-tight">No tickets found</div>
                        <div className="text-xs text-[#64748B] max-w-[280px]">
                          We couldn't find any tickets matching your search or filter criteria.
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8fafc] transition-colors group whitespace-nowrap cursor-pointer"
                >
                  {columnOrder.map((colId) => {
                    if (colId === 'ticketDetails' && visibleColumns.ticketDetails) {
                      return (
                        <td key={colId} className="py-4 px-5 text-[#1e293b]">
                          <div className="flex flex-col min-w-0">
                            {(() => {
                              const displayTitle = formatDeviceTitle(ticket.brand, ticket.model, ticket.title);
                              return (
                                <span className="truncate max-w-[200px] text-[#1e293b] text-sm font-semibold" title={displayTitle}>
                                  {displayTitle}
                                </span>
                              );
                            })()}
                            <span className="text-xs text-[#64748B] font-normal truncate max-w-[200px] mt-0.5">
                              {ticket.ticketNumber || ticket.jobNumber || ticket.description}
                            </span>
                          </div>
                        </td>
                      );
                    }
                    if (colId === 'customer' && visibleColumns.customer) {
                      return (
                        <td key={colId} className="py-4 px-5 text-[#334155]">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[140px] text-sm font-semibold text-[#1e293b]" title={ticket.customer?.name || 'Walk-in'}>
                              {ticket.customer?.name || 'Walk-in Customer'}
                            </span>
                            {ticket.customer?.phone && (
                              <span className="text-xs text-[#64748B] font-normal font-mono mt-0.5">
                                {ticket.customer.phone}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    }
                    if (colId === 'assignee' && visibleColumns.assignee) {
                      return (
                        <td key={colId} className="py-4 px-5 text-[#334155] font-medium text-sm">
                          <span className="truncate max-w-[120px] block" title={ticket.assignedTo?.name || 'Unassigned'}>
                            {ticket.assignedTo?.name || 'Unassigned'}
                          </span>
                        </td>
                      );
                    }
                    if (colId === 'priority' && visibleColumns.priority) {
                      return (
                        <td key={colId} className="py-4 px-5">
                          <span className={getPriorityTextStyle(ticket.priority)}>
                            {ticket.priority}
                          </span>
                        </td>
                      );
                    }
                    if (colId === 'warranty' && (visibleColumns as any).warranty) {
                      const w = getWarrantyDisplay(ticket.warrantyStatus);
                      return (
                        <td key={colId} className="py-4 px-5">
                          {w.isactive ? (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${w.badgeClass}`}>
                              {w.label}
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] font-mono text-xs">{w.label}</span>
                          )}
                        </td>
                      );
                    }
                    if (colId === 'status' && visibleColumns.status) {
                      return (
                        <td key={colId} className="py-4 px-5">
                          <StatusBadge status={ticket.status} />
                        </td>
                      );
                    }
                    if (colId === 'createdAt' && visibleColumns.createdAt) {
                      return (
                        <td key={colId} className="py-4 px-5 text-[#475569] font-mono text-xs font-medium">
                          {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      );
                    }
                    return null;
                  })}

                  {/* Actions */}
                  <td className="py-4 px-5 text-right relative">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionMenuId(activeActionMenuId === ticket.id ? null : ticket.id);
                          }}
                          className="w-8 h-8 flex items-center justify-center border border-[#e2e8f0] hover:border-[#116dff] text-[#116dff] hover:bg-[#116dff]/5 rounded-full transition-colors"
                          title="More Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeActionMenuId === ticket.id && (
                          <div
                            className="absolute right-0 mt-1 w-40 bg-white border border-[#e2e8f0] rounded-lg shadow-2xl z-50 p-1.5 text-left animate-in fade-in zoom-in-95"
                            onMouseLeave={() => setActiveActionMenuId(null)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTicket(ticket);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#475569] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-md transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details
                            </button>

                            {onEditTicket && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTicket(ticket);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#475569] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-md transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit Ticket
                              </button>
                            )}

                            {onDeleteTicket && (
                              <>
                                <div className="my-1 border-t border-[#e2e8f0]" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
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

      {/* Infinite Scroll Sentinel & Loading / Completion Footer */}
      <div ref={loadMoreRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="py-4 text-center border-t border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center gap-2 text-xs font-semibold text-[#116dff]">
          <Loader2 className="w-4 h-4 animate-spin text-[#116dff]" />
          <span>Loading more tickets...</span>
        </div>
      )}

      {!hasNextPage && tickets.length > 0 && (
        <div className="py-3 text-center border-t border-[#e2e8f0] bg-[#f8fafc] text-[11px] font-medium text-[#94a3b8]">
          All tickets loaded ({tickets.length} of {totalCount})
        </div>
      )}
    </div>
  );
};