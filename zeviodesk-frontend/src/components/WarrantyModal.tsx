import React, { useState, useEffect } from 'react';
import { X, Shield, FileText } from 'lucide-react';

export interface WarrantyItem {
  id: string;
  type: string;
  provider: string;
  duration: number;
  unit: 'Days' | 'Months' | 'Years';
  expiryDate?: string;
  notes?: string;
  docFileName?: string;
}

interface WarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (warranty: WarrantyItem) => void;
}

export const WarrantyModal: React.FC<WarrantyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [type, setType] = useState('Shop Warranty');
  const [provider, setProvider] = useState('ZevioDesk Shop');
  const [duration, setDuration] = useState<number | ''>(90);
  const [unit, setUnit] = useState<'Days' | 'Months' | 'Years'>('Days');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [docFileName, setDocFileName] = useState('');

  // Automatically compute expiry date when duration or unit changes
  useEffect(() => {
    if (isOpen) {
      const durNum = typeof duration === 'number' ? duration : 0;
      if (durNum > 0) {
        const d = new Date();
        if (unit === 'Days') {
          d.setDate(d.getDate() + durNum);
        } else if (unit === 'Months') {
          d.setMonth(d.getMonth() + durNum);
        } else if (unit === 'Years') {
          d.setFullYear(d.getFullYear() + durNum);
        }
        setExpiryDate(d.toISOString().split('T')[0]);
      } else {
        setExpiryDate('');
      }
    }
  }, [duration, unit, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      id: `w_${Date.now()}`,
      type,
      provider,
      duration: typeof duration === 'number' ? duration : (parseInt(String(duration)) || 1),
      unit,
      expiryDate: expiryDate || undefined,
      notes: notes || undefined,
      docFileName: docFileName || undefined,
    });
    // Reset fields
    setNotes('');
    setExpiryDate('');
    setDocFileName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
          <h3 className="text-base font-bold text-[#1e293b] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#116dff]" /> New Warranty
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748b] hover:text-[#1e293b] hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Warranty Type & Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
                Warranty Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 rounded-xl text-xs text-[#1e293b] outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23116dff%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat"
              >
                <option value="Shop Warranty">Shop Warranty</option>
                <option value="Manufacturer Warranty">Manufacturer Warranty</option>
                <option value="Supplier Warranty">Supplier Warranty</option>
                <option value="Workmanship Warranty">Workmanship Warranty</option>
                <option value="Extended Warranty">Extended Warranty</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
                Provider Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={provider}
                onChange={e => setProvider(e.target.value)}
                placeholder="Provider name"
                className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 rounded-xl text-xs text-[#1e293b] placeholder-[#94a3b8] outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 2: Duration & Period Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Duration</label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') {
                    setDuration('');
                  } else {
                    const parsed = parseInt(val, 10);
                    setDuration(isNaN(parsed) ? '' : parsed);
                  }
                }}
                onWheel={e => e.currentTarget.blur()}
                className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 rounded-xl text-xs text-[#1e293b] placeholder-[#94a3b8] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Period Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as any)}
                className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 rounded-xl text-xs text-[#1e293b] outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23116dff%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat"
              >
                <option value="Days">Days</option>
                <option value="Months">Months</option>
                <option value="Years">Years</option>
              </select>
            </div>
          </div>

          {/* Row 3: Expiry Date */}
          <div>
            <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Expiry Date (Optional)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 rounded-xl text-xs text-[#1e293b] outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Row 4: Warranty Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Warranty Notes / Terms</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enter notes about the warranty..."
              className="w-full px-3 py-2.5 rounded-xl border border-[#cbd5e1] text-xs text-[#1e293b] placeholder:text-slate-400 focus:border-[#116dff] outline-none transition-colors"
            />
          </div>

          {/* Row 5: File attachment */}
          <div>
            <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
              Warranty Document / Certificate
            </label>
            <label className="flex items-center gap-3 w-full h-10 px-3.5 bg-white border border-[#cbd5e1] hover:border-[#116dff] rounded-xl cursor-pointer transition-all group">
              <FileText className="w-4 h-4 text-[#64748b] group-hover:text-[#116dff] shrink-0 transition-colors" />
              <span className={`text-xs truncate ${docFileName ? 'text-[#1e293b] font-medium' : 'text-[#94a3b8]'}`}>
                {docFileName || 'Click to select a file...'}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setDocFileName(file.name);
                }}
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#64748b] hover:text-[#1e293b] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#116dff] hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
          >
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
};
