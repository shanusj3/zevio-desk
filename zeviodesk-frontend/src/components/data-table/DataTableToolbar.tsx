import React from 'react';
import { Search, Upload, SlidersHorizontal } from 'lucide-react';

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onExportCsv?: () => void;
  filterComponent?: React.ReactNode;
  onCustomColumnsClick?: () => void;
}

export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  onExportCsv,
  filterComponent,
  onCustomColumnsClick,
}) => {
  return (
    <div className="p-3 px-4 border-b border-[#e2e8f0] flex items-center justify-end gap-3 flex-wrap bg-white">
      {/* Right Controls Group: Filter, Export, Customize, Search */}
      <div className="flex items-center gap-2 flex-wrap md:flex-nowrap w-full md:w-auto">
        {/* Custom Filter Popover / Button */}
        {filterComponent}

        {/* Export CSV Button */}
        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="w-9 h-9 rounded-full border border-[#cbd5e1] bg-white text-[#116dff] flex items-center justify-center hover:bg-[#116dff] hover:text-white hover:border-[#116dff] transition-all cursor-pointer group"
            title="Export CSV"
          >
            <Upload className="w-4 h-4" />
          </button>
        )}

        {/* Column Customizer Button */}
        {onCustomColumnsClick && (
          <button
            type="button"
            onClick={onCustomColumnsClick}
            className="w-9 h-9 rounded-full border border-[#cbd5e1] bg-white text-[#1e293b] flex items-center justify-center hover:bg-[#116dff] hover:text-white hover:border-[#116dff] transition-all cursor-pointer group"
            title="Customize Columns"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#116dff] group-hover:text-white transition-colors" />
          </button>
        )}

        {/* Search Input Box */}
        <div className="relative flex-1 md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#116dff]" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 bg-white border border-[#cbd5e1] rounded-full pl-10 pr-4 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
