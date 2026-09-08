import React, { useState } from 'react';
import { DataTableToolbar } from './DataTableToolbar';
import { TableRowSkeleton } from '../Skeleton';
import { Package } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
  onExportCsv?: () => void;
  filterComponent?: React.ReactNode;
  onRowClick?: (row: T) => void;
  emptyState?: {
    title: string;
    description: string;
    action?: React.ReactNode;
  };
  keyExtractor: (row: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  searchPlaceholder = 'Search...',
  onSearchChange,
  onExportCsv,
  filterComponent,
  onRowClick,
  emptyState,
  keyExtractor,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('');

  const handleSearch = (val: string) => {
    setInternalSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden animate-in fade-in duration-150">
      {/* Shared Toolbar */}
      <DataTableToolbar
        searchValue={internalSearch}
        onSearchChange={handleSearch}
        searchPlaceholder={searchPlaceholder}
        onExportCsv={onExportCsv}
        filterComponent={filterComponent}
      />

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`py-3.5 px-4 sm:px-6 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e2e8f0] text-xs">
            {/* Loading Skeletons */}
            {isLoading && (
              <>
                <TableRowSkeleton cols={columns.length} />
                <TableRowSkeleton cols={columns.length} />
                <TableRowSkeleton cols={columns.length} />
                <TableRowSkeleton cols={columns.length} />
              </>
            )}

            {/* Empty State */}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#eff6ff] text-[#116dff] flex items-center justify-center">
                      <Package className="w-7 h-7" />
                    </div>
                    <p className="text-base font-bold text-[#1e293b]">
                      {emptyState?.title || 'No data found'}
                    </p>
                    <p className="text-xs text-[#64748b] max-w-xs">
                      {emptyState?.description || 'No matching items available.'}
                    </p>
                    {emptyState?.action && <div className="pt-2">{emptyState.action}</div>}
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!isLoading &&
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'hover:bg-[#f8fafc] cursor-pointer group' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-4 px-4 sm:px-6 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
