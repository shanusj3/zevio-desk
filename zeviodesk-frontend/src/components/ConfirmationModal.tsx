import React from 'react';
import { X, AlertTriangle, AlertCircle, HelpCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';

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
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getHeaderBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-[#ff6b6b] text-white';
      case 'warning':
        return 'bg-[#f59e0b] text-white';
      case 'info':
      default:
        return 'bg-[#116dff] text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-8 h-8 text-[#ff6b6b]" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto shadow-xs">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto shadow-xs">
            <HelpCircle className="w-8 h-8 text-[#116dff]" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-[#ff6b6b] hover:bg-[#fa5252] text-white shadow-xs';
      case 'warning':
        return 'bg-[#f59e0b] hover:bg-[#d97706] text-white shadow-xs';
      case 'info':
      default:
        return 'bg-[#116dff] hover:bg-[#0d5fd9] text-white shadow-xs';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Light Backdrop - Low opacity, subtle 2px blur */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className={`px-5 py-3.5 flex items-center justify-between font-bold text-base ${getHeaderBg()}`}>
          <span>{title || 'Confirm Deletion'}</span>
          <button
            onClick={onCancel}
            type="button"
            className="p-1 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 text-center">
          {getIcon()}

          <div className="space-y-1 max-w-xs mx-auto">
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCancel}
              leftIcon={<X className="w-3.5 h-3.5" />}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={type === 'danger' ? 'danger' : 'primary'}
              size="sm"
              onClick={onConfirm}
              isLoading={isLoading}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
