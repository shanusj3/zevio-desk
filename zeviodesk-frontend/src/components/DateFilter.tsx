import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X } from 'lucide-react';
import { DateFilterOption, DateRange } from '../lib/filterUtils';

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
          className="flex items-center gap-2 h-11 px-4 bg-[#162030] border border-[#22314a] rounded-lg text-sm text-white hover:border-[#D99B26]/50 transition-colors min-w-[160px]"
        >
          <Calendar className="w-4 h-4 text-[#D99B26] shrink-0" />
          <span className="flex-1 text-left text-sm text-white truncate">
            {option === 'CUSTOM' && customRange.startDate && customRange.endDate
              ? `${customRange.startDate.toLocaleDateString()} – ${customRange.endDate.toLocaleDateString()}`
              : getLabel(option)}
          </span>
          <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 mt-2 w-52 bg-[#111827] border border-[#22314a] rounded-xl shadow-2xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
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
                    ? 'text-[#D99B26] bg-[#D99B26]/10'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1e293b]'
                }`}
              >
                <Calendar className={`w-4 h-4 shrink-0 ${option === opt.value ? 'text-[#D99B26]' : 'text-[#64748B]'}`} />
                <span className="flex-1">{opt.label}</span>
                {option === opt.value && <Check className="w-4 h-4 text-[#D99B26] shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Range Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#0c1017] border border-[#22314a] rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1b2536] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D99B26]" />
                <h3 className="font-bold text-white text-base">Select Custom Range</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold">Start Date</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full h-11 px-4 bg-[#162030] border border-[#22314a] rounded-xl text-sm text-white outline-none focus:border-[#D99B26] [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold">End Date</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full h-11 px-4 bg-[#162030] border border-[#22314a] rounded-xl text-sm text-white outline-none focus:border-[#D99B26] [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#0a0d13] border-t border-[#1b2536] flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-[#94A3B8] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!tempStart || !tempEnd || new Date(tempStart) > new Date(tempEnd)}
                className="px-5 py-2 bg-[#D99B26] hover:bg-[#E5A93C] disabled:bg-[#D99B26]/30 disabled:text-[#0d121c]/40 disabled:cursor-not-allowed text-[#0d121c] font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#D99B26]/10"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
