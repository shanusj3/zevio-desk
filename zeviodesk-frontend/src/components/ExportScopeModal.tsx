import React, { useState, useEffect } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';

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

  const options: { value: ExportScope; label: string; count: number; disabled?: boolean }[] = [
    { value: 'all', label: 'All Tickets', count: allCount },
    { value: 'filtered', label: 'Filtered Tickets', count: filteredCount },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onExport(scope)}
            isLoading={isExporting}
          >
            Export
          </Button>
        </>
      }
    >
      <div className="space-y-4">
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

        {note && (
          <div className="p-3 bg-[#f0f4f7] border border-[#e2e8f0] rounded-xl">
            <p className="text-xs text-[#64748B]">
              <span className="font-semibold text-[#475569]">Note:</span> {note}
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
