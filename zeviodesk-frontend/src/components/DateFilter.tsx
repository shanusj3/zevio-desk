import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X } from 'lucide-react';
import { DateFilterOption, DateRange } from '../lib/filterUtils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface DateFilterProps {
  option: DateFilterOption;
  setOption: (option: DateFilterOption) => void;
  customRange: DateRange;
  setCustomRange: (range: DateRange) => void;
}

const OPTIONS: { label: string; value: DateFilterOption }[] = [
  { label: 'Today', value: 'TODAY' },
  { label: 'This Week', value: 'THIS_WEEK' },
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'Custom Range...', value: 'CUSTOM' },
];

function getLabel(option: DateFilterOption) {
  return OPTIONS.find((o) => o.value === option)?.label ?? 'Today';
}

export const DateFilter: React.FC<DateFilterProps> = ({
  option,
  setOption,
  customRange,
  setCustomRange,
}) => {
  const [open, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Temporary state for the modal inputs, only applied on clicking "Apply"
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync temp dates when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTempStart(customRange.startDate ? customRange.startDate.toISOString().split('T')[0] : '');
      setTempEnd(customRange.endDate ? customRange.endDate.toISOString().split('T')[0] : '');
    }
  }, [isModalOpen, customRange]);

  const handleApply = () => {
    setCustomRange({
      startDate: tempStart ? new Date(tempStart) : null,
      endDate: tempEnd ? new Date(tempEnd) : null,
    });
    setOption('CUSTOM');
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="relative" ref={ref}>
        {/* Trigger Button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 h-11 px-4 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#1e293b] hover:border-[#116dff]/50 transition-colors min-w-[160px] shadow-sm"
        >
          <Calendar className="w-4 h-4 text-[#116dff] shrink-0" />
          <span className="flex-1 text-left text-sm text-[#1e293b] truncate">
            {option === 'CUSTOM' && customRange.startDate && customRange.endDate
              ? `${customRange.startDate.toLocaleDateString()} – ${customRange.endDate.toLocaleDateString()}`
              : getLabel(option)}
          </span>
          <ChevronDown className={`w-4 h-4 text-[#94a3b8] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 mt-2 w-52 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  if (opt.value === 'CUSTOM') {
                    setIsModalOpen(true);
                  } else {
                    setOption(opt.value);
                  }
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                  option === opt.value
                    ? 'text-[#116dff] bg-[#116dff]/10'
                    : 'text-[#475569] hover:text-[#1e293b] hover:bg-[#f8fafc]'
                }`}
              >
                <Calendar className={`w-4 h-4 shrink-0 ${option === opt.value ? 'text-[#116dff]' : 'text-[#94a3b8]'}`} />
                <span className="flex-1">{opt.label}</span>
                {option === opt.value && <Check className="w-4 h-4 text-[#116dff] shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Range Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#116dff]" />
                <h3 className="font-bold text-[#1e293b] text-base">Select Custom Range</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#94a3b8] hover:text-[#1e293b] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <Input
                label="Start Date"
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="[color-scheme:light]"
              />
              <Input
                label="End Date"
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="[color-scheme:light]"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApply}
                disabled={!tempStart || !tempEnd || new Date(tempStart) > new Date(tempEnd)}
              >
                Apply Range
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
