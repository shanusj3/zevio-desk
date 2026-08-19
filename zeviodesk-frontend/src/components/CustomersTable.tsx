import React, { useEffect, useRef, useState } from 'react';
import { Search, User, Phone, Mail, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Customer } from '../lib/api';
import { useInfiniteCustomersQuery } from '../hooks/useCustomersQuery';
import { TableRowSkeleton } from './Skeleton';

interface CustomersTableProps {
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
}

export const CustomersTable: React.FC<CustomersTableProps> = ({
  onEditCustomer,
  onDeleteCustomer,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [alphabetFilter, setAlphabetFilter] = useState('All');
  const observerRef = useRef<HTMLDivElement>(null);
  const alphabets = ['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput), 500);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } = useInfiniteCustomersQuery({
    search: debouncedSearch,
    alphabet: alphabetFilter,
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

  const customers = data?.pages.flatMap((page) => page?.customers ?? []) ?? [];
  const filteredCustomers = customers.filter((customer): customer is Customer => Boolean(customer?.name)).filter((customer) => {
    const searchLower = debouncedSearch.trim().toLowerCase();
    const matchesSearch = customer.name.toLowerCase().includes(searchLower)
      || (customer.email || '').toLowerCase().includes(searchLower)
      || (customer.phone || '').toLowerCase().includes(searchLower)
      || (customer.customerType || '').toLowerCase().includes(searchLower);
    const matchesAlphabet = alphabetFilter === 'All' || customer.name.trim().toUpperCase().startsWith(alphabetFilter);
    return matchesSearch && matchesAlphabet;
  });
  const totalCustomersCount = data?.pages[0]?.total ?? 0;
  const isFiltering = isLoading || (isFetching && !isFetchingNextPage);
  const getCustomerTypeColor = (type: Customer['customerType']) => {
    switch (type) {
      case 'BUSINESS':
        return 'bg-[#1E3A8A]/80 text-[#93C5FD] border border-[#2563EB]/30';
      case 'RETURNING':
        return 'bg-[#064E3B]/80 text-[#34D399] border border-[#059669]/30';
      case 'WALK_IN':
      default:
        return 'bg-[#1e293b]/80 text-[#94a3b8] border border-[#334155]/30';
    }
  };

  return (
    <div className="bg-[#101622] border border-[#1b2536] rounded-lg shadow-xl overflow-hidden">
      {/* Search and alphabet filters */}
      <div className="p-5 border-b border-[#1b2536] space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Shop Customers</h3>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-11 bg-[#162030] border border-[#22314a] rounded-lg pl-10 pr-4 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#D99B26] transition-colors"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#1b2536]/60 pt-4 text-xs text-[#64748B] select-none">
          <span className="mr-2 font-medium text-[#94A3B8]">Name filter by</span>
          {alphabets.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => setAlphabetFilter(letter)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${alphabetFilter === letter ? 'bg-[#D99B26] text-[#0d121c] shadow-sm' : 'text-[#94A3B8] hover:bg-[#182236] hover:text-white'}`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left text-xs min-w-[800px]">
          <thead>
            <tr className="border-b border-[#1b2536] bg-[#0c111a]/60 text-[#64748B] uppercase tracking-wider font-semibold whitespace-nowrap">
              <th className="py-3.5 px-5">Customer Name</th>
              <th className="py-3.5 px-5">Contact Details</th>
              <th className="py-3.5 px-5">Customer Type</th>
              <th className="py-3.5 px-5">Internal Notes</th>
              <th className="py-3.5 px-5">Joined Date</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2536]/80 text-[#CBD5E1]">
            {isFiltering ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={6} />
                ))}
              </>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-[#162030] rounded-full flex items-center justify-center border border-[#22314a]">
                      <User className="w-8 h-8 text-[#D99B26]" />
                    </div>
                    <div className="text-sm font-medium text-[#E2E8F0]">
                      No customers found
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#151d2d]/80 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#162030] border border-[#22314a] flex items-center justify-center text-[#94A3B8] font-bold text-[10px]">
                        {customer.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{customer.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                          <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                          <span className="font-mono text-[11px]">{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                          <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                          <span className="font-mono text-[11px]">{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getCustomerTypeColor(customer.customerType)}`}>
                      {customer.customerType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-[#94A3B8] font-normal truncate max-w-[200px]" title={customer.notes || ''}>
                    {customer.notes || '—'}
                  </td>
                  <td className="py-3.5 px-5 text-[#94A3B8] font-mono text-[11px]">
                    {new Date(customer.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEditCustomer(customer)}
                        className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1e2a40] rounded-lg transition-colors cursor-pointer"
                        title="Edit Customer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCustomer(customer)}
                        className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div ref={observerRef} className="flex justify-center border-t border-[#1b2536] p-5 text-xs text-[#64748B]">
          {isFetchingNextPage ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-[#D99B26]" />Loading more customers...</div> : 'Scroll for more'}
        </div>
      )}
      <div className="p-4 border-t border-[#1b2536] text-xs text-[#64748B]">
        Showing <span className="font-semibold text-white">{filteredCustomers.length}</span> of{' '}
        <span className="font-semibold text-white">{totalCustomersCount}</span> customers
      </div>
    </div>
  );
};
