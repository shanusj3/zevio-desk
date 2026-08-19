import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  MoreVertical,
  UserCheck,
  Upload,
  Store,
  Pencil,
  Power,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { Tenant, FilterOptions } from '../types';
import { TableRowSkeleton } from './Skeleton';

import { useInfiniteTenantsQuery } from '../hooks/useTenantsQuery';

interface TenantsTableProps {
  mode: 'dashboard' | 'tenants';
  onSelectTenant: (tenant: Tenant) => void;
  onEditTenant: (tenant: Tenant) => void;
  onToggleTenantStatus: (tenant: Tenant) => void;
  onDeleteTenant: (tenant: Tenant) => void;
  onOpenImportModal?: () => void;
}

export const TenantsTable: React.FC<TenantsTableProps> = ({
  mode,
  onSelectTenant,
  onEditTenant,
  onToggleTenantStatus,
  onDeleteTenant,
  onOpenImportModal,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Pending'>('All');
  const [alphabetFilter, setAlphabetFilter] = useState('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = useInfiniteTenantsQuery({
    search: debouncedSearch,
    status: statusFilter,
    alphabet: alphabetFilter,
    limit: 15
  });

  // True while fetching new filter/search results (not just initial load)
  const isFiltering = isLoading || (isFetching && !isFetchingNextPage);

  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allFetchedTenants = data?.pages.flatMap((p) => p?.tenants || []) || [];

  // Client-side guard: filter by status to prevent stale data from a previous
  // query key appearing while the new filtered request is in flight.
  const paginatedTenants = allFetchedTenants.filter((t) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Active') return t.status === 'Active';
    if (statusFilter === 'Inactive') return t.status === 'Inactive';
    if (statusFilter === 'Pending') return t.status === 'Pending';
    return true;
  });

  const totalTenantsCount = data?.pages[0]?.total || 0;

  const filterRef = useRef<HTMLDivElement>(null);

  const alphabets = [
    'All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ];

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

  // Close dropdown on outside click

  return (
    <div className="bg-[#101622] border border-[#1b2536] rounded-lg shadow-xl overflow-hidden">
      {/* Top Header Controls Bar */}
      <div className="p-5 border-b border-[#1b2536] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {mode === 'dashboard' ? (
            <h3 className="text-lg font-bold text-white tracking-tight">
              All Tenants
            </h3>
          ) : (
            <div className="flex items-center gap-3">
              {onOpenImportModal && (
                <button
                  onClick={onOpenImportModal}
                  className="px-4 h-11 bg-[#182236] hover:bg-[#202d47] text-white rounded-lg text-xs font-semibold flex items-center gap-2 border border-[#2a3a57] transition-all"
                >
                  <Upload className="w-4 h-4 text-[#94A3B8]" />
                  <span>Import</span>
                </button>
              )}
            </div>
          )}

          {/* Search Input & Filter Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input Box */}
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-11 bg-[#162030] border border-[#22314a] rounded-lg pl-10 pr-4 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#D99B26] transition-colors"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`px-4 h-11 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-colors ${statusFilter !== 'All'
                    ? 'bg-[#D99B26]/20 text-[#D99B26] border-[#D99B26]/40'
                    : 'bg-[#162030] text-[#94A3B8] hover:text-white border-[#22314a]'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
                {statusFilter !== 'All' && (
                  <span className="bg-[#D99B26] text-[#0d121c] font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    1
                  </span>
                )}
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#121824] border border-[#22314a] rounded-lg shadow-2xl z-40 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Status Filter
                  </div>
                  {(['All', 'Active', 'Inactive', 'Pending'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-md transition-colors ${statusFilter === st
                          ? 'bg-[#D99B26]/15 text-[#D99B26] font-semibold'
                          : 'text-[#94A3B8] hover:text-white hover:bg-[#182030]'
                        }`}
                    >
                      <span>{st} Tenants</span>
                      {statusFilter === st && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alphabet Filter Bar (Tenants View Only) */}
        {mode === 'tenants' && (
          <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs text-[#64748B] select-none border-t border-[#1b2536]/60">
            <span className="font-medium mr-2 text-[#94A3B8]">
              Name filter by
            </span>
            {alphabets.map((char) => (
              <button
                key={char}
                onClick={() => setAlphabetFilter(char)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${alphabetFilter === char
                    ? 'bg-[#D99B26] text-[#0d121c] shadow-sm'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182236]'
                  }`}
              >
                {char}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left text-xs min-w-[850px]">
          <thead>
            <tr className="border-b border-[#1b2536] bg-[#0c111a]/60 text-[#64748B] uppercase tracking-wider font-semibold whitespace-nowrap">
              <th className="py-3.5 px-5 min-w-[200px]">Tenant / Shop</th>
              <th className="py-3.5 px-5 min-w-[150px]">Shop Admin</th>
              <th className="py-3.5 px-5 min-w-[180px]">Email</th>
              <th className="py-3.5 px-5 min-w-[140px]">Phone</th>
              {mode === 'tenants' && <th className="py-3.5 px-5 min-w-[90px]">Users</th>}
              <th className="py-3.5 px-5 min-w-[110px]">Status</th>
              <th className="py-3.5 px-5 min-w-[120px]">Created At</th>
              <th className="py-3.5 px-5 text-right min-w-[110px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2536]/80 text-[#CBD5E1]">
            {isFiltering ? (
              <>
                {Array.from({ length: 7 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={mode === 'tenants' ? 8 : 7} />
                ))}
              </>
            ) : paginatedTenants.length === 0 ? (
              <tr>
                <td
                  colSpan={mode === 'tenants' ? 8 : 7}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-[#162030] rounded-full flex items-center justify-center border border-[#22314a] shadow-inner">
                      <Search className="w-8 h-8 text-[#EF4444]" />
                    </div>
                    <div className="text-sm font-medium text-[#E2E8F0]">
                      No tenants found
                    </div>
                    <div className="text-xs text-[#64748B] max-w-[250px]">
                      We couldn't find any tenants matching your current search or filter criteria.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="hover:bg-[#151d2d]/80 transition-colors group whitespace-nowrap"
                >
                  {/* Tenant / Shop */}
                  <td className="py-3.5 px-5 font-semibold text-white">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm border border-white/10"
                        style={{
                          backgroundColor: tenant.primaryColor || '#7C3AED',
                        }}
                      >
                        {tenant.logoUrl ? (
                          <img
                            src={tenant.logoUrl}
                            alt={tenant.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Store className="w-4 h-4" />
                        )}
                      </div>
                      <span className="truncate max-w-[180px] inline-block align-middle" title={tenant.name}>
                        {tenant.name}
                      </span>
                    </div>
                  </td>

                  {/* Shop Admin */}
                  <td className="py-3.5 px-5 text-[#E2E8F0] font-medium">
                    <span className="truncate max-w-[140px] inline-block align-middle" title={tenant.adminName}>
                      {tenant.adminName}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-5 text-[#94A3B8] font-normal">
                    <span className="truncate max-w-[180px] inline-block align-middle" title={tenant.businessEmail}>
                      {tenant.businessEmail}
                    </span>
                  </td>

                  {/* Phone */}
                  <td className="py-3.5 px-5 text-[#94A3B8] font-mono">
                    <span className="truncate max-w-[130px] inline-block align-middle" title={tenant.phone}>
                      {tenant.phone}
                    </span>
                  </td>

                  {/* Users (Tenants view) */}
                  {mode === 'tenants' && (
                    <td className="py-3.5 px-5 text-white font-semibold whitespace-nowrap">
                      {tenant.usersCount}
                    </td>
                  )}

                  {/* Status Pill */}
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        tenant.status === 'Active'
                          ? 'bg-[#064E3B]/80 text-[#34D399] border border-[#059669]/30'
                          : tenant.status === 'Pending'
                          ? 'bg-[#78350F]/80 text-[#FCD34D] border border-[#D97706]/30'
                          : 'bg-[#7F1D1D]/80 text-[#F87171] border border-[#DC2626]/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          tenant.status === 'Active'
                            ? 'bg-[#34D399]'
                            : tenant.status === 'Pending'
                            ? 'bg-[#FCD34D]'
                            : 'bg-[#F87171]'
                        }`}
                      />
                      {tenant.status}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="py-3.5 px-5 text-[#94A3B8] font-mono text-[11px] whitespace-nowrap">
                    {tenant.createdAt}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right relative">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Details Eye Icon */}
                      <button
                        onClick={() => onSelectTenant(tenant)}
                        className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1e2a40] rounded-lg transition-colors"
                        title="View Tenant Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Manage Users Icon (Tenants View) */}
                      {mode === 'tenants' && (
                        <button
                          onClick={() => onSelectTenant(tenant)}
                          className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1e2a40] rounded-lg transition-colors"
                          title="Manage Users"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}

                      {/* More Menu Toggle */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveActionMenuId(
                              activeActionMenuId === tenant.id ? null : tenant.id
                            )
                          }
                          className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1e2a40] rounded-lg transition-colors"
                          title="More Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeActionMenuId === tenant.id && (
                          <div
                            className="absolute right-0 mt-1 w-44 bg-[#121824] border border-[#23314a] rounded-lg shadow-2xl z-50 p-1.5 text-left animate-in fade-in zoom-in-95"
                            onMouseLeave={() => setActiveActionMenuId(null)}
                          >
                            <button
                              onClick={() => {
                                onSelectTenant(tenant);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#94A3B8] hover:text-white hover:bg-[#1c263a] rounded-md transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Overview
                            </button>
                            <button
                              onClick={() => {
                                onEditTenant(tenant);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#94A3B8] hover:text-white hover:bg-[#1c263a] rounded-md transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit Tenant
                            </button>
                            <button
                              onClick={() => {
                                onToggleTenantStatus(tenant);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#94A3B8] hover:text-white hover:bg-[#1c263a] rounded-md transition-colors"
                            >
                              <Power className="w-3.5 h-3.5 text-[#F59E0B]" />
                              {tenant.status === 'Active'
                                ? 'Suspend Tenant'
                                : 'Activate Tenant'}
                            </button>
                            <div className="my-1 border-t border-[#23314a]" />
                            <button
                              onClick={() => {
                                onDeleteTenant(tenant);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Tenant
                            </button>
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

      {/* Infinite Scroll Observer Target */}
      {hasNextPage && (
        <div
          ref={observerRef}
          className="p-6 border-t border-[#1b2536] flex justify-center text-[#64748B]"
        >
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#D99B26]" />
              <span className="text-xs">Loading more...</span>
            </div>
          ) : (
            <div className="text-xs">Scroll for more</div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="p-4 border-t border-[#1b2536] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
        <div>
          Showing{' '}
          <span className="font-semibold text-white">
            {paginatedTenants.length}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-white">
            {totalTenantsCount}
          </span>{' '}
          tenants
        </div>
      </div>
    </div>
  );
};
