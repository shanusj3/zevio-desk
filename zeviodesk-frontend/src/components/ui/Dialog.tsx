import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  headerVariant?: 'default' | 'danger' | 'warning' | 'info' | 'primary';
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

const headerVariantMap = {
  default: 'bg-white border-b border-[#e2e8f0] text-[#1e293b]',
  primary: 'bg-[#116dff] text-white',
  danger: 'bg-[#ff6b6b] text-white',
  warning: 'bg-[#f59e0b] text-white',
  info: 'bg-[#116dff] text-white',
};

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  headerVariant = 'default',
  children,
  footer,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${maxWidthMap[maxWidth]} bg-white rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col`}
          >
            {/* Header */}
            {title && (
              <div className={`px-6 py-4 flex items-center justify-between font-bold text-base ${headerVariantMap[headerVariant]}`}>
                <div className="truncate">{title}</div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      headerVariant === 'default'
                        ? 'text-[#64748b] hover:bg-slate-100 hover:text-[#1e293b]'
                        : 'text-white/80 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="p-6 overflow-y-auto max-h-[80vh] flex-1 space-y-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
