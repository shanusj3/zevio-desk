import React, { useEffect, useState, useCallback } from 'react';
import {
  Globe,
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Package,
  Database,
} from 'lucide-react';
import { catalogApi, CatalogItem, CatalogItemsParams } from '../lib/api';

const SOURCE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  GLOBAL: {
    label: 'Zeviodesk',
    icon: <Globe className="size-3" />,
    color: 'text-[#60A5FA]',
    bg: 'bg-[#1e3a5f]/60',
  },
  TENANT: {
    label: 'This organization',
    icon: <Building2 className="size-3" />,
    color: 'text-[#34D399]',
    bg: 'bg-[#0d2a1f]/60',
  },
};

const LIMIT = 20;

export function ItemCatalogSettings() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'GLOBAL' | 'TENANT'>('ALL');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: CatalogItemsParams = {
        page,
        limit: LIMIT,
        search: debouncedQuery || undefined,
        source: sourceFilter !== 'ALL' ? sourceFilter : undefined,
      };
      const result = await catalogApi.getItems(params);
      setItems(result.items);
      setTotal(result.total);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedQuery, sourceFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="size-5 text-[#d9a743]" />
            Item Catalog
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            All device models and items — Zeviodesk global entries and items your team has serviced.
          </p>
        </div>
        <button
          onClick={() => load()}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#131b2e] px-3 text-xs font-semibold text-[#94A3B8] hover:text-white transition cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog…"
            className="h-10 w-full rounded-lg border border-white/[0.07] bg-[#141b2b] pl-9 pr-4 text-sm text-white outline-none placeholder:text-[#64748B] focus:border-[#d9a743] focus:ring-2 focus:ring-[#d9a743]/10 transition"
          />
        </div>

        {/* Source filter tabs */}
        <div className="flex rounded-lg border border-white/[0.07] bg-[#141b2b] p-0.5">
          {(['ALL', 'GLOBAL', 'TENANT'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setSourceFilter(s); setPage(1); }}
              className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition cursor-pointer ${
                sourceFilter === s
                  ? 'bg-[#d9a743] text-[#15171d]'
                  : 'text-[#64748B] hover:text-white'
              }`}
            >
              {s === 'GLOBAL' && <Globe className="size-3" />}
              {s === 'TENANT' && <Building2 className="size-3" />}
              {s === 'ALL' ? 'All Sources' : s === 'GLOBAL' ? 'Zeviodesk' : 'Your Org'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#101622]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Item / Model</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Category</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Manufacturer</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Source</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Used</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-[#d9a743]" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Package className="mx-auto size-10 text-[#1e2d45] mb-3" />
                    <p className="text-sm text-[#64748B]">No catalog items found</p>
                    {debouncedQuery && (
                      <p className="text-xs text-[#475569] mt-1">Try a different search term</p>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const src = SOURCE_LABELS[item.source] || SOURCE_LABELS.GLOBAL;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">{item.name}</span>
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] text-xs">
                        <span className="rounded-md bg-[#1a2235] px-2 py-1">{item.category}</span>
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] text-xs">
                        {item.manufacturer || <span className="text-[#475569]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${src.color} ${src.bg}`}>
                          {src.icon}
                          {src.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-[#64748B]">
                          {item.usageCount != null ? item.usageCount : <span className="text-[#475569]">—</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
          <p className="text-xs text-[#64748B]">
            {total} item{total !== 1 ? 's' : ''} · page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex size-8 items-center justify-center rounded-lg border border-white/[0.07] text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex size-8 items-center justify-center rounded-lg border border-white/[0.07] text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
