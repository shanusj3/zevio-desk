import React from 'react';
import { X, AlertTriangle, AlertCircle, HelpCircle, Trash2 } from 'lucide-react';
import { Dialog } from './ui/Dialog';
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

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title={title || 'Confirm Deletion'}
      headerVariant={type}
      maxWidth="sm"
      footer={
        <>
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
        </>
      }
    >
      <div className="space-y-4 text-center">
        {getIcon()}
        <div className="space-y-1 max-w-xs mx-auto">
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Dialog>
  );
};
