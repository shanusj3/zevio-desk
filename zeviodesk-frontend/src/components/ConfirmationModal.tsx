import React from 'react';
import { X, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-8 h-8 text-[#EF4444]" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8 text-[#F59E0B]" />;
      case 'info':
      default:
        return <HelpCircle className="w-8 h-8 text-[#3B82F6]" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-[#EF4444] hover:bg-[#DC2626] text-white focus:ring-[#EF4444]/20';
      case 'warning':
        return 'bg-[#F59E0B] hover:bg-[#D97706] text-white focus:ring-[#F59E0B]/20';
      case 'info':
      default:
        return 'bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] focus:ring-[#D99B26]/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#0f1522] border border-[#1e2a40] rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#131b2e] rounded-xl border border-[#1e2a40] shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            type="button"
            className="p-1.5 text-[#64748B] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2a40]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-[#182236] hover:bg-[#202d47] text-white rounded-xl text-xs font-semibold border border-[#2d3d5e] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 ${getConfirmButtonClass()}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
