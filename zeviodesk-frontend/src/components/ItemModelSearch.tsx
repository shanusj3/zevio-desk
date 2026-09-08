import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, Check, Globe, Building2, Plus } from 'lucide-react';
import { catalogApi, CatalogItem } from '../lib/api';

export type ResolutionSource = 'CATALOG' | 'CUSTOM';

export interface CatalogResolution {
  model: string;
  brand?: string;
  itemCategory?: string;
  globalCatalogItemId?: string | null;
  tenantCatalogItemId?: string | null;
  source: ResolutionSource;
}

interface ItemModelSearchProps {
  value: string;
  onChange: (resolution: CatalogResolution) => void;
  required?: boolean;
  inputStyle?: string;
  labelStyle?: string;
}

const inputBase = 'h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-xs text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15';
const labelBase = 'mb-1.5 block text-xs font-semibold text-[#1e293b]';

export function ItemModelSearch({ value, onChange, required, labelStyle }: ItemModelSearchProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [resolvedItem, setResolvedItem] = useState<CatalogItem | null>(null);
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number>(0);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await catalogApi.search(q.trim(), 12);
      setSuggestions(results);
      setIsOpen(true);
    } catch {
      setSuggestions([]);
      setIsOpen(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setResolvedItem(null);
    setIsCustomSelected(false);

    // Notify parent immediately with raw custom string
    onChange({
      model: q,
      brand: undefined,
      itemCategory: undefined,
      globalCatalogItemId: null,
      tenantCatalogItemId: null,
      source: 'CUSTOM',
    });

    clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => doSearch(q), 250);
  };

  const handleSelectSuggestion = (item: CatalogItem) => {
    setQuery(item.name);
    setResolvedItem(item);
    setSuggestions([]);
    setIsOpen(false);
    setIsCustomSelected(false);
    onChange({
      model: item.name,
      brand: item.manufacturer || undefined,
      itemCategory: item.category || undefined,
      globalCatalogItemId: item.globalCatalogItemId,
      tenantCatalogItemId: item.tenantCatalogItemId,
      source: 'CATALOG',
    });
  };

  const handleSelectCustom = () => {
    setResolvedItem(null);
    setSuggestions([]);
    setIsOpen(false);
    setIsCustomSelected(true);
    onChange({
      model: query,
      brand: undefined,
      itemCategory: undefined,
      globalCatalogItemId: null,
      tenantCatalogItemId: null,
      source: 'CUSTOM',
    });
  };

  const handleClear = () => {
    setQuery('');
    setResolvedItem(null);
    setSuggestions([]);
    setIsOpen(false);
    setIsCustomSelected(false);
    onChange({
      model: '',
      brand: undefined,
      itemCategory: undefined,
      globalCatalogItemId: null,
      tenantCatalogItemId: null,
      source: 'CUSTOM',
    });
  };

  const lL = labelStyle || labelBase;
  const isResolvedCatalog = resolvedItem !== null;

  return (
    <div ref={containerRef} className="relative">
      <label className={lL}>
        Device / Model {required && <span className="text-[#ef4444]">*</span>}
      </label>


        <div className={`flex items-center rounded-xl border transition ${isResolvedCatalog
            ? 'border-[#86efac] bg-[#f0fdf4]'
            : isOpen
              ? 'border-[#116dff] ring-2 ring-[#116dff]/15 bg-white'
              : 'border-[#cbd5e1] bg-white'
          } h-11`}>
          {isSearching ? (
            <Loader2 className="ml-3.5 size-4 shrink-0 animate-spin text-[#116dff]" />
          ) : isResolvedCatalog ? (
            <Check className="ml-3.5 size-4 shrink-0 text-[#16a34a]" />
          ) : (
            <Search className="ml-3.5 size-4 shrink-0 text-[#94a3b8]" />
          )}
          <input
            value={query}
            onChange={handleQueryChange}
            onFocus={() => { if (query.trim()) setIsOpen(true); }}
            placeholder="e.g. iPhone 13, Samsung S23, custom device…"
            className="min-w-0 flex-1 bg-transparent px-3 text-xs text-[#1e293b] outline-none placeholder:text-[#94a3b8]"
          />
          {query && (
            <button type="button" onClick={handleClear} className="mr-3 p-1 text-[#94a3b8] hover:text-[#1e293b] cursor-pointer">
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Resolved Catalog badge */}
        {isResolvedCatalog && resolvedItem && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#166534]">
            {resolvedItem.source === 'GLOBAL' ? (
              <Globe className="size-3 text-[#16a34a]" />
            ) : (
              <Building2 className="size-3 text-[#16a34a]" />
            )}
            <span className="text-xs">{resolvedItem.category} · {resolvedItem.manufacturer || 'Unknown'}</span>
          </div>
        )}

        {/* Custom badge */}
        {isCustomSelected && !isResolvedCatalog && query.trim() && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#475569]">
            <span className="inline-flex items-center gap-1 bg-[#f1f5f9] px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#cbd5e1]">
              Custom model
            </span>
          </div>
        )}

        {/* Dropdown suggestions & Custom option */}
        {isOpen && query.trim() && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-[#cbd5e1] bg-white shadow-xl">
            {suggestions.length > 0 && (
              <div className="max-h-56 overflow-y-auto p-1.5">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Catalog Matches</p>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => handleSelectSuggestion(item)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-[#f8fafc] cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#1e293b]">{item.name}</p>
                      <p className="truncate text-[11px] text-[#64748b]">
                        {item.manufacturer || 'Unknown'} · {item.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Friendly "No catalog match" or Custom Model Option */}
            <div className="border-t border-[#cbd5e1] p-2 bg-[#f8fafc]">
              {suggestions.length === 0 && !isSearching && (
                <p className="px-3 pt-1 pb-2 text-[11px] text-[#64748b] font-medium">No catalog match</p>
              )}
              <button
                type="button"
                onMouseDown={handleSelectCustom}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#116dff] hover:bg-[#eff6ff] transition cursor-pointer"
              >
                <Plus className="size-3.5 shrink-0 text-[#116dff]" />
                <span className="truncate">Use "{query}" as custom model</span>
              </button>
            </div>
          </div>
        )}
      </div>
  );
}
