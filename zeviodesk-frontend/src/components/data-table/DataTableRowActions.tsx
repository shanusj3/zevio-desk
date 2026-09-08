import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface ActionItem {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DataTableRowActionsProps {
  actions: ActionItem[];
}

export const DataTableRowActions: React.FC<DataTableRowActionsProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position popover aligned to right edge of button
      const dropdownWidth = 140;
      const leftPos = Math.max(10, rect.right - dropdownWidth);
      const topPos = rect.bottom + 4;
      setCoords({ top: topPos, left: leftPos });
    }
    setIsOpen(!isOpen);
  };

  // Close popover on window scroll or resize
  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => setIsOpen(false);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-8 h-8 rounded-full hover:bg-slate-100 text-[#64748b] hover:text-[#1e293b] inline-flex items-center justify-center transition-colors cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            <div
              style={{ top: coords.top, left: coords.left }}
              className="fixed z-[9999] bg-white border border-[#dfe5eb] rounded-xl shadow-xl p-1 min-w-[140px] animate-in fade-in duration-150 text-left font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {actions.map((act, idx) => {
                const IconComp = act.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      act.onClick();
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                      act.variant === 'danger'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-[#1e293b] hover:bg-[#f4f7ff] hover:text-[#116dff]'
                    }`}
                  >
                    {IconComp && <IconComp className="w-3.5 h-3.5" />}
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
