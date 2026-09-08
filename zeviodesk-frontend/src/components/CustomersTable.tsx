import React, { useEffect, useRef, useState } from 'react';
import { Search, User, Phone, Mail, Pencil, Trash2, Loader2, Filter, Upload, SlidersHorizontal, X, ChevronDown, MoreVertical, GripVertical } from 'lucide-react';
import { Customer } from '../lib/api';
import { useInfiniteCustomersQuery } from '../hooks/useCustomersQuery';
import { TableRowSkeleton } from './Skeleton';

interface CustomersTableProps {
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onExportClick?: () => void;
  onFilteredCountChange?: (count: number) => void;
  onTotalCountChange?: (count: number) => void;
}

import { useDebouncedValue } from '../hooks/useDebouncedValue';

export const CustomersTable: React.FC<CustomersTableProps> = ({
  onEditCustomer,
  onDeleteCustomer,
  onExportClick,
  onFilteredCountChange,
  onTotalCountChange,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 500);
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'All' | 'WALK_IN' | 'RETURNING' | 'BUSINESS'>('All');
  const observerRef = useRef<HTMLDivElement>(null);

  const [isFilterDrawerMounted, setIsFilterDrawerMounted] = useState(false);
  const [isFilterDrawerVisible, setIsFilterDrawerVisible] = useState(false);
  const [typeSectionOpen, setTypeSectionOpen] = useState(true);

  const [isCustomizationMounted, setIsCustomizationMounted] = useState(false);
  const [isCustomizationVisible, setIsCustomizationVisible] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState({
    customerName: true,
    contactDetails: true,
    customerType: true,
    internalNotes: true,
    joinedDate: true,
  });

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'customerName',
    'contactDetails',
    'customerType',
    'internalNotes',
    'joinedDate',
  ]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [colSearch, setColSearch] = useState('');

  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const custCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } = useInfiniteCustomersQuery({
    search: debouncedSearch,
    limit: 15,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.5 },
    );
    const currentObserver = observerRef.current;
    if (currentObserver) observer.observe(currentObserver);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const openFilterDrawer = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsFilterDrawerMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsFilterDrawerVisible(true);
      });
    });
  };

  const closeFilterDrawer = () => {
    setIsFilterDrawerVisible(false);
    closeTimeoutRef.current = setTimeout(() => {
      setIsFilterDrawerMounted(false);
    }, 250);
  };

  const openCustomization = () => {
    if (custCloseTimeoutRef.current) clearTimeout(custCloseTimeoutRef.current);
    setIsCustomizationMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsCustomizationVisible(true);
      });
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

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

  const closeCustomization = () => {
    setIsCustomizationVisible(false);
    custCloseTimeoutRef.current = setTimeout(() => {
      setIsCustomizationMounted(false);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (custCloseTimeoutRef.current) clearTimeout(custCloseTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isFilterDrawerMounted || isCustomizationMounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFilterDrawerMounted, isCustomizationMounted]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFilterDrawer();
        closeCustomization();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const customers = data?.pages.flatMap((page) => page?.customers ?? []) ?? [];
  const filteredCustomers = customers.filter((customer): customer is Customer => Boolean(customer?.name)).filter((customer) => {
    const searchLower = debouncedSearch.trim().toLowerCase();
    const matchesSearch = customer.name.toLowerCase().includes(searchLower)
      || (customer.email || '').toLowerCase().includes(searchLower)
      || (customer.phone || '').toLowerCase().includes(searchLower)
      || (customer.customerType || '').toLowerCase().includes(searchLower);
    const matchesType = customerTypeFilter === 'All' || customer.customerType === customerTypeFilter;
    return matchesSearch && matchesType;
  });

  const totalCustomersCount = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    onFilteredCountChange?.(filteredCustomers.length);
  }, [filteredCustomers.length, onFilteredCountChange]);

  useEffect(() => {
    onTotalCountChange?.(totalCustomersCount);
  }, [totalCustomersCount, onTotalCountChange]);

  const activeFilterCount = customerTypeFilter !== 'All' ? 1 : 0;
  const hasFilters = activeFilterCount > 0;
  const clearAllFilters = () => setCustomerTypeFilter('All');

  const isFiltering = isLoading || (isFetching && !isFetchingNextPage);

  const activeColCount = 2 +
    (visibleColumns.contactDetails ? 1 : 0) +
    (visibleColumns.customerType ? 1 : 0) +
    (visibleColumns.internalNotes ? 1 : 0) +
    (visibleColumns.joinedDate ? 1 : 0);

  const getCustomerTypeColor = (type: Customer['customerType']) => {
    switch (type) {
      case 'BUSINESS':
        return 'bg-[#1E3A8A] text-[#dbeafe] border border-[#2563EB]/40';
      case 'RETURNING':
        return 'bg-[#064E3B] text-[#d1fae5] border border-[#059669]/40';
      case 'WALK_IN':
      default:
        return 'bg-[#1e293b] text-white border border-[#334155]/40';
    }
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
      
      {/* Top Header Controls Bar */}
      <div className="p-3 px-4 border-b border-[#e2e8f0]">
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
          
          {/* Right Side: Filters & Search */}
          <div className="flex items-center gap-2">
            
            {/* Filter Button Container */}
            <div className="relative">
              <button
                onClick={openFilterDrawer}
                className={`px-4 h-9 rounded-full text-sm font-medium flex items-center gap-2 border transition-all cursor-pointer bg-white text-[#116dff] hover:bg-[#116dff] hover:text-white hover:border-[#116dff] ${
                  hasFilters ? 'border-[#93c5fd]' : 'border-[#e2e8f0]'
                }`}
              >
                <Filter className="w-4 h-4 animate-in fade-in" />
                <span>Filter</span>
              </button>
              {hasFilters && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#dbeafe] text-[#1e293b] font-semibold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-sm pointer-events-none animate-in scale-in duration-150">
                  {activeFilterCount}
                </span>
              )}
            </div>

            {/* Export Button */}
            <button
              onClick={onExportClick}
              className="w-9 h-9 flex items-center justify-center border border-[#e2e8f0] hover:border-[#116dff] rounded-full hover:bg-[#116dff] hover:text-white transition-all text-[#116dff] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Customize Columns Button */}
            <button
              onClick={openCustomization}
              className="w-9 h-9 flex items-center justify-center border border-[#e2e8f0] hover:border-[#116dff] rounded-full hover:bg-[#116dff] hover:text-white transition-all text-[#116dff] cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#116dff]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-48 md:w-64 h-9 bg-white border border-[#e2e8f0] rounded-full pl-9 pr-4 text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] transition-colors"
              />
            </div>

          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      {isFilterDrawerMounted && (
        <div className="fixed inset-0 top-12 z-40 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 transition-opacity duration-200 ease-out"
            style={{ opacity: isFilterDrawerVisible ? 1 : 0 }}
            onClick={closeFilterDrawer}
          />

          {/* Panel */}
          <div
            className="relative w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col transition-transform duration-200 ease-out z-10"
            style={{
              transform: isFilterDrawerVisible ? 'translateX(0)' : 'translateX(100%)',
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-base font-semibold text-[#1e293b]">
                Filter customers
              </h2>
              <button
                onClick={closeFilterDrawer}
                className="p-1.5 text-[#64748B] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Customer Type Accordion */}
              <div>
                <button
                  onClick={() => setTypeSectionOpen(!typeSectionOpen)}
                  className={`w-full px-6 flex items-center justify-between py-3.5 transition-colors ${
                    !typeSectionOpen ? 'hover:bg-[#f8fafc]' : ''
                  }`}
                >
                  <span className="text-sm font-semibold text-[#1e293b] leading-none">Customer Type</span>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 self-center text-[#64748B] transition-transform ${
                    typeSectionOpen ? '' : '-rotate-90'
                  }`} />
                </button>

                {typeSectionOpen && (
                  <div className="px-6 py-2 space-y-1">
                    {[
                      { value: 'All', label: 'All Types' },
                      { value: 'WALK_IN', label: 'Walk-in' },
                      { value: 'RETURNING', label: 'Returning' },
                      { value: 'BUSINESS', label: 'Business' },
                    ].map((type) => (
                      <label
                        key={type.value}
                        className="flex items-center gap-2.5 px-1 py-2 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="customerType"
                          className="hidden"
                          checked={customerTypeFilter === type.value}
                          onChange={() => setCustomerTypeFilter(type.value as any)}
                        />
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 self-center transition-colors ${
                            customerTypeFilter === type.value
                              ? 'border-[#116dff]'
                              : 'border-[#cbd5e1] group-hover:border-[#94a3b8]'
                          }`}
                        >
                          {customerTypeFilter === type.value && (
                            <span className="w-2 h-2 rounded-full bg-[#116dff]" />
                          )}
                        </span>
                        <span
                          className={`text-[13px] leading-none self-center ${
                            customerTypeFilter === type.value
                              ? 'text-[#116dff] font-semibold'
                              : 'text-[#334155]'
                          }`}
                        >
                          {type.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0]">
              <span className="text-[13px] font-medium text-[#64748B]">
                {hasFilters
                  ? `${activeFilterCount} filter applied`
                  : 'No filters applied'}
              </span>
              <button
                onClick={clearAllFilters}
                disabled={!hasFilters}
                className={`text-[13px] font-semibold transition-colors ${
                  hasFilters
                    ? 'text-[#116dff] hover:underline cursor-pointer'
                    : 'text-[#94a3b8] cursor-not-allowed'
                }`}
              >
                Clear all
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Customization Drawer */}
      {isCustomizationMounted && (
        <div className="fixed inset-0 top-12 z-40 flex justify-end animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/30 transition-opacity duration-200 ease-out"
            style={{ opacity: isCustomizationVisible ? 1 : 0 }}
            onClick={closeCustomization}
          />

          <div
            className="relative w-full max-w-[400px] h-full bg-white shadow-2xl flex flex-col transition-transform duration-200 ease-out z-10"
            style={{
              transform: isCustomizationVisible ? 'translateX(0)' : 'translateX(100%)',
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
              <h2 className="text-base font-semibold text-[#1e293b]">Customize columns</h2>
              <button
                onClick={closeCustomization}
                className="p-1 text-[#64748B] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-xs text-[#64748B]">Select which columns to show, or drag them into a different order.</p>

              {/* Column Search Bar */}
              <div className="relative my-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search columns..."
                  value={colSearch}
                  onChange={(e) => setColSearch(e.target.value)}
                  className="w-full h-9 bg-white border border-[#e2e8f0] rounded-full pl-9 pr-4 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] transition-colors"
                />
              </div>

              <div className="divide-y divide-[#e2e8f0] border border-[#e2e8f0] rounded-xl overflow-hidden mt-4">
                {columnOrder.map((colId, idx) => {
                  const isMandatory = colId === 'customerName';
                  const isVisible = visibleColumns[colId as keyof typeof visibleColumns];
                  
                  let label = '';
                  switch (colId) {
                    case 'customerName': label = 'Customer Name'; break;
                    case 'contactDetails': label = 'Contact Details'; break;
                    case 'customerType': label = 'Customer Type'; break;
                    case 'internalNotes': label = 'Internal Notes'; break;
                    case 'joinedDate': label = 'Joined Date'; break;
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
                onClick={closeCustomization}
                className="px-5 h-10 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-semibold rounded-full text-sm transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left text-xs min-w-[800px]">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] uppercase tracking-wider font-semibold whitespace-nowrap">
              {columnOrder.map((colId) => {
                if (colId === 'customerName' && visibleColumns.customerName) {
                  return (
                    <th key={colId} className="py-3.5 px-5">
                      Customer Name
                    </th>
                  );
                }
                if (colId === 'contactDetails' && visibleColumns.contactDetails) {
                  return (
                    <th key={colId} className="py-3.5 px-5">
                      Contact Details
                    </th>
                  );
                }
                if (colId === 'customerType' && visibleColumns.customerType) {
                  return (
                    <th key={colId} className="py-3.5 px-5">
                      Customer Type
                    </th>
                  );
                }
                if (colId === 'internalNotes' && visibleColumns.internalNotes) {
                  return (
                    <th key={colId} className="py-3.5 px-5">
                      Internal Notes
                    </th>
                  );
                }
                if (colId === 'joinedDate' && visibleColumns.joinedDate) {
                  return (
                    <th key={colId} className="py-3.5 px-5">
                      Joined Date
                    </th>
                  );
                }
                return null;
              })}
              <th className="py-3.5 px-5 text-right min-w-[110px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0] text-[#334155]">
            {isFiltering ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={activeColCount} />
                ))}
              </>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={activeColCount} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <img
                      src="/empty-customers.png"
                      alt="No customers found"
                      className="w-64 max-w-full h-auto object-contain opacity-90"
                    />
                    <div className="text-sm font-bold text-[#1e293b] tracking-tight">
                      No customers found
                    </div>
                    <div className="text-xs text-[#64748B] max-w-[280px]">
                      We couldn't find any customers matching your search or filter criteria.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8fafc] transition-colors whitespace-nowrap">
                  {columnOrder.map((colId) => {
                    if (colId === 'customerName' && visibleColumns.customerName) {
                      return (
                        <td key={colId} className="py-4 px-5 font-semibold text-[#1e293b]">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#116dff]/10 border border-[#116dff]/20 flex items-center justify-center text-[#116dff] font-bold text-xs">
                              {customer.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-[#1e293b]">{customer.name}</span>
                          </div>
                        </td>
                      );
                    }
                    if (colId === 'contactDetails' && visibleColumns.contactDetails) {
                      return (
                        <td key={colId} className="py-4 px-5">
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center gap-1.5 text-[#64748B]">
                                <Mail className="w-3.5 h-3.5 text-[#116dff]" />
                                <span className="font-semibold text-xs text-[#334155]">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-1.5 text-[#64748B]">
                                <Phone className="w-3.5 h-3.5 text-[#116dff]" />
                                <span className="font-mono font-semibold text-xs text-[#334155]">{customer.phone}</span>
                              </div>
                            )}
                            {!customer.email && !customer.phone && (
                              <span className="text-xs text-[#94a3b8] font-medium">—</span>
                            )}
                          </div>
                        </td>
                      );
                    }
                    if (colId === 'customerType' && visibleColumns.customerType) {
                      return (
                        <td key={colId} className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getCustomerTypeColor(customer.customerType)}`}>
                            {customer.customerType.replace('_', ' ')}
                          </span>
                        </td>
                      );
                    }
                    if (colId === 'internalNotes' && visibleColumns.internalNotes) {
                      return (
                        <td key={colId} className="py-4 px-5 text-xs text-[#64748B] font-medium truncate max-w-[200px]" title={customer.notes || ''}>
                          {customer.notes || '—'}
                        </td>
                      );
                    }
                    if (colId === 'joinedDate' && visibleColumns.joinedDate) {
                      return (
                        <td key={colId} className="py-4 px-5 text-xs text-[#64748B] font-mono font-semibold">
                          {new Date(customer.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      );
                    }
                    return null;
                  })}

                  {/* Actions Dropdown */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionMenuId(
                              activeActionMenuId === customer.id ? null : customer.id
                            );
                          }}
                          className="w-8 h-8 flex items-center justify-center border border-[#e2e8f0] hover:border-[#116dff] text-[#116dff] hover:bg-[#116dff]/5 rounded-full transition-colors cursor-pointer"
                          title="More Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeActionMenuId === customer.id && (
                          <div
                            className="absolute right-0 mt-1 w-40 bg-white border border-[#e2e8f0] rounded-lg shadow-2xl z-50 p-1.5 text-left animate-in fade-in zoom-in-95"
                            onMouseLeave={() => setActiveActionMenuId(null)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditCustomer(customer);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#475569] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-md transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit Customer
                            </button>
                            <div className="my-1 border-t border-[#e2e8f0]" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCustomer(customer);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Customer
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

      {hasNextPage && (
        <div ref={observerRef} className="flex justify-center border-t border-[#e2e8f0] p-5 text-xs text-[#64748B]">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#116dff]" />
              Loading more customers...
            </div>
          ) : (
            'Scroll for more'
          )}
        </div>
      )}
    </div>
  );
};
