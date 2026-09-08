import React, { useState } from 'react';
import { DataTableToolbar } from './DataTableToolbar';
import { TableRowSkeleton } from '../Skeleton';
import { EmptyState } from '../common/EmptyState';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onExportCsv?: () => void;
  filterComponent?: React.ReactNode;
  onCustomColumnsClick?: () => void;
  onRowClick?: (row: T) => void;
  hideToolbar?: boolean;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  keyExtractor: (row: T) => string;
  footer?: React.ReactNode;
  minHeightClassName?: string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  onExportCsv,
  filterComponent,
  onCustomColumnsClick,
  onRowClick,
  hideToolbar = false,
  emptyState,
  keyExtractor,
  footer,
  minHeightClassName,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('');

  const currentSearch = searchValue !== undefined ? searchValue : internalSearch;

  const handleSearch = (val: string) => {
    if (searchValue === undefined) {
      setInternalSearch(val);
    }
    if (onSearchChange) onSearchChange(val);
  };

  const showToolbar = !hideToolbar && (onSearchChange !== undefined || onExportCsv !== undefined || filterComponent !== undefined || onCustomColumnsClick !== undefined);

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden animate-in fade-in duration-150">
      {/* Shared Toolbar */}
      {showToolbar && (
        <DataTableToolbar
          searchValue={currentSearch}
          onSearchChange={handleSearch}
          searchPlaceholder={searchPlaceholder}
          onExportCsv={onExportCsv}
          filterComponent={filterComponent}
          onCustomColumnsClick={onCustomColumnsClick}
        />
      )}

      {/* Table Container */}
      <div className={`overflow-x-auto ${minHeightClassName || ''}`}>
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
                  } ${col.className || ''}`}
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
                  <EmptyState
                    icon={emptyState?.icon}
                    title={emptyState?.title || 'No data found'}
                    description={emptyState?.description || 'No matching records found.'}
                    action={emptyState?.action}
                  />
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
                    onRowClick ? 'hover:bg-[#f8fafc] cursor-pointer group' : 'hover:bg-[#f8fafc]'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3.5 px-4 sm:px-6 ${
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

      {/* Optional Footer (e.g. Pagination or item counter) */}
      {footer}
    </div>
  );
}
