import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, Check, Globe, Building2 } from 'lucide-react';
import { catalogApi, CatalogItem } from '../lib/api';

// Controlled category taxonomy
export const ITEM_TYPES = ['Device', 'Spare Part', 'Accessory', 'Component', 'Consumable', 'Other'] as const;
export type ItemType = typeof ITEM_TYPES[number];

export const CATEGORIES_BY_TYPE: Record<ItemType, string[]> = {
  'Device':      ['Smartphone', 'Laptop', 'Tablet', 'Desktop', 'Smart Watch', 'Camera', 'Printer', 'Television', 'Handheld', 'Other Device'],
  'Spare Part':  ['Display', 'Battery', 'Charging Port', 'Motherboard', 'Keyboard', 'Speaker', 'Microphone', 'Camera Module', 'Other Part'],
  'Accessory':   ['Cable', 'Charger', 'Adapter', 'Case', 'Screen Protector', 'Stylus', 'Other Accessory'],
  'Component':   ['PCB', 'IC', 'Connector', 'Sensor', 'Capacitor', 'Other Component'],
  'Consumable':  ['Thermal Paste', 'Solder', 'Flux', 'Adhesive', 'Cleaning Kit', 'Other Consumable'],
  'Other':       ['Other'],
};

export type ResolutionState = 'idle' | 'searching' | 'resolved_global' | 'resolved_tenant' | 'unknown';

export interface CatalogResolution {
  model: string;
  itemCategory: string;
  brand: string;
  globalCatalogItemId: string | null;
  tenantCatalogItemId: string | null;
  state: ResolutionState;
}

interface ItemModelSearchProps {
  value: string;
  onChange: (resolution: CatalogResolution) => void;
  required?: boolean;
  inputStyle?: string;
  labelStyle?: string;
}

const inputBase = 'h-[52px] w-full rounded-lg border border-white/[0.07] bg-[#252d3e] px-4 text-sm text-white outline-none transition placeholder:text-[#9aa1b0] focus:border-[#d9a743] focus:ring-2 focus:ring-[#d9a743]/15';
const labelBase = 'mb-2 block text-sm font-semibold text-[#edf0f6]';

export function ItemModelSearch({ value, onChange, required, inputStyle, labelStyle }: ItemModelSearchProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [resolutionState, setResolutionState] = useState<ResolutionState>('idle');
  const [resolvedItem, setResolvedItem] = useState<CatalogItem | null>(null);
  // Unknown item category state
  const [unknownItemType, setUnknownItemType] = useState<ItemType>('Device');
  const [unknownCategory, setUnknownCategory] = useState('');

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
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setResolvedItem(null);
    setResolutionState(q.trim() ? 'searching' : 'idle');
    setUnknownCategory('');

    // Notify parent immediately with the raw string (unresolved)
    onChange({
      model: q,
      itemCategory: '',
      brand: '',
      globalCatalogItemId: null,
      tenantCatalogItemId: null,
      state: 'unknown',
    });

    clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => doSearch(q), 280);
  };

  const handleSelectSuggestion = (item: CatalogItem) => {
    setQuery(item.name);
    setResolvedItem(item);
    setSuggestions([]);
    setIsOpen(false);
    const state: ResolutionState = item.source === 'GLOBAL' ? 'resolved_global' : 'resolved_tenant';
    setResolutionState(state);
    onChange({
      model: item.name,
      itemCategory: item.category,
      brand: item.manufacturer || '',
      globalCatalogItemId: item.globalCatalogItemId,
      tenantCatalogItemId: item.tenantCatalogItemId,
      state,
    });
  };

  const handleClear = () => {
    setQuery('');
    setResolvedItem(null);
    setSuggestions([]);
    setIsOpen(false);
    setResolutionState('idle');
    setUnknownCategory('');
    onChange({ model: '', itemCategory: '', brand: '', globalCatalogItemId: null, tenantCatalogItemId: null, state: 'idle' });
  };

  const handleInputBlur = () => {
    // A short delay so click on suggestion fires first
    setTimeout(() => {
      if (!resolvedItem && query.trim() && resolutionState !== 'resolved_global' && resolutionState !== 'resolved_tenant') {
        setResolutionState('unknown');
        setIsOpen(false);
      }
    }, 150);
  };

  const handleUnknownCategoryChange = (cat: string) => {
    setUnknownCategory(cat);
    onChange({
      model: query,
      itemCategory: cat,
      brand: '',
      globalCatalogItemId: null,
      tenantCatalogItemId: null,
      state: 'unknown',
    });
  };

  const isResolved = resolutionState === 'resolved_global' || resolutionState === 'resolved_tenant';
  const isUnknown = resolutionState === 'unknown';
  const iL = inputStyle || inputBase;
  const lL = labelStyle || labelBase;

  return (
    <div className="space-y-4">
      {/* Model Search Field */}
      <div ref={containerRef} className="relative">
        <label className={lL}>
          Item / Model {required && <span className="text-[#f0c65f]">*</span>}
        </label>

        <div className={`flex items-center rounded-lg border transition ${
          isResolved
            ? 'border-[#34D399]/50 bg-[#0d2a1f]'
            : isUnknown
            ? 'border-[#f0c65f]/40 bg-[#252d3e]'
            : isOpen
            ? 'border-[#d9a743] ring-2 ring-[#d9a743]/15 bg-[#171f2e]'
            : 'border-white/[0.07] bg-[#252d3e]'
        } h-[52px]`}>
          {isSearching ? (
            <Loader2 className="ml-4 size-4 shrink-0 animate-spin text-[#d9a743]" />
          ) : isResolved ? (
            <Check className="ml-4 size-4 shrink-0 text-[#34D399]" />
          ) : (
            <Search className="ml-4 size-4 shrink-0 text-[#c5cad3]" />
          )}
          <input
            value={query}
            onChange={handleQueryChange}
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
            onBlur={handleInputBlur}
            placeholder="Search or enter item / model…"
            className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-[#9aa1b0]"
          />
          {query && (
            <button type="button" onClick={handleClear} className="mr-3 p-1 text-[#c5cad3] hover:text-white cursor-pointer">
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Resolved badge */}
        {isResolved && resolvedItem && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            {resolvedItem.source === 'GLOBAL' ? (
              <Globe className="size-3 text-[#94A3B8]" />
            ) : (
              <Building2 className="size-3 text-[#94A3B8]" />
            )}
            <span className="text-[#94A3B8]">{resolvedItem.category} · {resolvedItem.manufacturer || 'Unknown'}</span>
          </div>
        )}

        {/* Dropdown suggestions */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-[#39445a] bg-[#161e2e] shadow-2xl shadow-black/50">
            <div className="max-h-60 overflow-y-auto p-1.5">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={() => handleSelectSuggestion(item)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/[0.06] cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                    <p className="truncate text-xs text-[#94A3B8]">
                      {item.category} · {item.manufacturer || 'Unknown manufacturer'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {isOpen && suggestions.length === 0 && !isSearching && query.trim() && (
              <div className="px-3 py-3 text-xs text-[#64748B]">No matches — you can still enter a custom item.</div>
            )}
          </div>
        )}
      </div>

      {/* Category selector — shown only for unknown items */}
      {isUnknown && (
        <div className="space-y-3 rounded-xl border border-[#f0c65f]/20 bg-[#1a1608]/60 p-4">
          <p className="text-xs text-[#f0c65f] font-medium">
            "{query}" is a new item. Please select its category.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#CBD5E1]">
                Item Type <span className="text-[#f0c65f]">*</span>
              </label>
              <select
                value={unknownItemType}
                onChange={(e) => {
                  const t = e.target.value as ItemType;
                  setUnknownItemType(t);
                  setUnknownCategory('');
                  handleUnknownCategoryChange('');
                }}
                className="w-full h-11 bg-[#141b2b] border border-[#23314a] focus:border-[#D99B26] rounded-xl px-3 text-xs text-white focus:outline-none appearance-none"
              >
                {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#CBD5E1]">
                Category <span className="text-[#f0c65f]">*</span>
              </label>
              <select
                value={unknownCategory}
                onChange={(e) => handleUnknownCategoryChange(e.target.value)}
                className="w-full h-11 bg-[#141b2b] border border-[#23314a] focus:border-[#D99B26] rounded-xl px-3 text-xs text-white focus:outline-none appearance-none"
              >
                <option value="">— Select category —</option>
                {CATEGORIES_BY_TYPE[unknownItemType].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Auto-filled category (resolved) */}
      {isResolved && resolvedItem && (
        <div>
          <label className={lL}>Category</label>
          <div className="flex h-[52px] items-center rounded-lg border border-[#34D399]/20 bg-[#0d2a1f]/60 px-4 gap-2">
            <Check className="size-4 text-[#34D399] shrink-0" />
            <span className="text-sm text-[#34D399] font-medium">{resolvedItem.category}</span>
            <span className="ml-auto text-[10px] text-[#4b7a63] bg-[#1a4a32] px-2 py-0.5 rounded-full">Auto-detected</span>
          </div>
        </div>
      )}
    </div>
  );
}
