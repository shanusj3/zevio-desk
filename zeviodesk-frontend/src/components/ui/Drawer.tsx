import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  topOffset?: string;
}

const widthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-none w-full',
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  topOffset = 'top-0',
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

  const isFull = maxWidth === 'full';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40"
          />

          {/* Panel — side drawer OR full-page modal */}
          {isFull ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-0 bg-white flex flex-col shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 py-5 border-b border-[#e2e8f0] flex items-center justify-between shrink-0 bg-white">
                <div className="text-base font-bold text-[#1e293b]">{title}</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-8 py-4 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0 bg-[#f8fafc]">
                  {footer}
                </div>
              )}
            </motion.div>
          ) : (
            /* Slide-over Drawer Panel */
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`fixed ${topOffset} right-0 bottom-0 w-full ${widthMap[maxWidth]} bg-white border-l border-[#e2e8f0] flex flex-col shadow-2xl z-50`}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between shrink-0 bg-white">
                <div className="text-base font-bold text-[#1e293b]">{title}</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0 bg-[#f8fafc]">
                  {footer}
                </div>
              )}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
