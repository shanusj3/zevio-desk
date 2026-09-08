import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export type ExportScope = 'all' | 'filtered';

interface ExportScopeModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  note?: string;
  allCount: number;
  filteredCount: number;
  selectedCount?: number;
  onClose: () => void;
  onExport: (scope: ExportScope) => void;
  isExporting?: boolean;
}

export const ExportScopeModal: React.FC<ExportScopeModalProps> = ({
  isOpen,
  title = 'Which items do you want to export?',
  description = 'Your items and all their data will be downloaded as a CSV file.',
  note,
  allCount,
  filteredCount,
  onClose,
  onExport,
  isExporting = false,
}) => {
  const [scope, setScope] = useState<ExportScope>('all');

  useEffect(() => {
    if (isOpen) setScope('all');
  }, [isOpen]);

  if (!isOpen) return null;

  const options: { value: ExportScope; label: string; count: number; disabled?: boolean }[] = [
    { value: 'all', label: 'All Tickets', count: allCount },
    { value: 'filtered', label: 'Filtered Tickets', count: filteredCount },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl z-10 animate-in zoom-in-95 duration-150 overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <h3 className="text-lg font-bold text-[#162d3d] pr-8">{title}</h3>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-[#64748B] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-2 space-y-4">
          <div className="space-y-3">
            {options.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 cursor-pointer group ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="export-scope"
                  value={opt.value}
                  checked={scope === opt.value}
                  disabled={opt.disabled}
                  onChange={() => setScope(opt.value)}
                  className="w-4 h-4 accent-[#116dff] cursor-pointer"
                />
                <span className="text-sm text-[#162d3d] group-hover:text-[#116dff] transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>

          <p className="text-sm text-[#64748B]">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-4 px-6 py-5">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-[#116dff] hover:underline cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onExport(scope)}
            disabled={isExporting}
            className="px-6 h-10 bg-[#116dff] hover:bg-[#0d5fd9] disabled:opacity-60 text-white font-semibold rounded-full text-sm transition-colors cursor-pointer"
          >
            {isExporting ? 'Exporting…' : 'Export'}
          </button>
        </div>

        {note && (
          <div className="px-6 py-3 bg-[#f0f4f7] border-t border-[#e2e8f0]">
            <p className="text-xs text-[#64748B]">
              <span className="font-semibold text-[#475569]">Note:</span> {note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
