import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Package, AlertTriangle, CornerDownLeft } from 'lucide-react';
import { inventoryApi, InventorySearchResult } from '../lib/api';

interface PartSearchComboProps {
  value: string;
  onChange: (value: string) => void;
  onSelectInventoryItem: (item: InventorySearchResult) => void;
  onSelectManual: () => void;
  inventoryEnabled: boolean;
  placeholder?: string;
  className?: string;
}

export const PartSearchCombo: React.FC<PartSearchComboProps> = ({
  value,
  onChange,
  onSelectInventoryItem,
  onSelectManual,
  inventoryEnabled,
  placeholder = 'Enter item name',
  className = '',
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<InventorySearchResult[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep internal query in sync with value parameter
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Load categories once when inventory is enabled
  useEffect(() => {
    if (inventoryEnabled) {
      inventoryApi.categories().then(setCategories).catch(() => {});
    }
  }, [inventoryEnabled]);

  // Debounced search logic (loads initial inventory products on focus/query/category change)
  useEffect(() => {
    if (!inventoryEnabled || !isOpen) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsLoading(true);
        const data = await inventoryApi.search(query.trim(), selectedCategory, 16);
        setResults(data);
      } catch (err) {
        console.error('Inventory search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [query, selectedCategory, inventoryEnabled, isOpen]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const listSize = results.length + 1; // results + manual option

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % listSize);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + listSize) % listSize);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < results.length) {
        handleSelectItem(results[focusedIndex]);
      } else if (focusedIndex === results.length || focusedIndex === -1) {
        handleSelectManual();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item: InventorySearchResult) => {
    onSelectInventoryItem(item);
    setQuery(item.name);
    setIsOpen(false);
  };

  const handleSelectManual = () => {
    onSelectManual();
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
    setFocusedIndex(-1);
  };

  // If inventory tracking is disabled, fall back to a simple, clean native input field
  if (!inventoryEnabled) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        required
      />
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center gap-2 w-full">
        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="h-[44px] px-3 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#1e293b] focus:border-[#116dff] outline-none cursor-pointer max-w-[140px] truncate shrink-0"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}

        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={className}
            autoComplete="off"
            required
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-[#116dff] animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-[#64748b]" />
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#e2e8f0] rounded-xl shadow-2xl z-[9999] overflow-hidden max-h-[320px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="py-1">
            {selectedCategory && (
              <div className="px-4 py-1.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#116dff]">Filter: {selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}
            {!isLoading && results.length === 0 && (
              <div className="px-4 py-4 text-xs text-[#64748b] text-center flex flex-col items-center justify-center gap-1.5 bg-[#f8fafc]">
                <Package className="w-5 h-5 text-[#94a3b8]" />
                <span className="font-bold text-[#1e293b]">No inventory items match your search</span>
                <span className="text-[11px] text-[#64748b]">
                  No parts found matching "{query || selectedCategory || 'your search'}"
                </span>
              </div>
            )}
            {results.map((item, index) => {
              const onHand = item.onHandStock ?? item.currentStock ?? 0;
              const reserved = item.reservedStock ?? 0;
              const avail = item.availableStock ?? (onHand - reserved);
              const isLowStock = avail <= item.minimumStock;
              const isOutOfStock = avail <= 0;
              const isFocused = index === focusedIndex;

              const warrantyText = item.warrantyDuration && item.warrantyUnit
                ? `${item.warrantyDuration} ${item.warrantyUnit.toLowerCase()}`
                : item.warrantyPeriod || null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-colors cursor-pointer border-none outline-none ${
                    isFocused ? 'bg-blue-50 text-[#116dff]' : 'text-[#1e293b] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Package className={`w-4 h-4 mt-0.5 shrink-0 ${isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-emerald-500'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-[#1e293b] truncate">{item.name}</p>
                      </div>
                      <p className="text-[10px] text-[#64748b] mt-0.5 font-mono truncate">
                        {item.brand && `${item.brand} `}{item.sku && `• SKU: ${item.sku}`}{warrantyText && ` • 🛡️ ${warrantyText}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <p className="font-mono text-[#1e293b] font-bold">₹{Number(item.sellingPrice).toLocaleString('en-IN')}</p>
                    {item.itemType === 'SERVICE' ? (
                      <span className="text-[9px] text-purple-600 mt-0.5 font-medium">Labor Service</span>
                    ) : isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 text-[9px] text-rose-600 font-semibold mt-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Out of Stock (0 avail)
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[9px] text-amber-600 font-semibold mt-0.5">
                        Low Stock ({avail} avail)
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-600 font-semibold mt-0.5">
                        {avail} avail ({onHand} on hand)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Manual entry option at the bottom */}
            <button
              type="button"
              onClick={handleSelectManual}
              className={`w-full flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] text-left text-xs font-bold transition-colors cursor-pointer outline-none ${
                focusedIndex === results.length ? 'bg-blue-50 text-[#116dff]' : 'text-[#116dff] hover:bg-[#f8fafc]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>➕ Add "{query || 'New Part'}" manually</span>
                <span className="text-[10px] text-slate-500 font-normal">(Untracked part)</span>
              </div>
              <CornerDownLeft className="w-3 h-3 text-[#64748b]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
