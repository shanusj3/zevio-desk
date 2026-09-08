import React from 'react';
import { Plus, Trash2, Lock } from 'lucide-react';
import { TicketLineItem } from '../../lib/api';

interface TicketPartsTabProps {
  partsLineItems: TicketLineItem[];
  totalPartsCost: number;
  isCompleted: boolean;
  onOpenAddPartModal: () => void;
  onDeletePart: (partId: string) => void;
}

const tableShellClass = 'overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-xs';
const tableClass = 'w-full text-left text-sm';
const theadClass = 'bg-[#f8fafc] border-b border-[#e2e8f0]';
const thClass = 'px-4 py-3 font-bold text-xs tracking-wider uppercase text-[#64748b] whitespace-nowrap';
const tbodyDivide = 'divide-y divide-[#e2e8f0]';

export const TicketPartsTab: React.FC<TicketPartsTabProps> = ({
  partsLineItems,
  totalPartsCost,
  isCompleted,
  onOpenAddPartModal,
  onDeletePart,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Section Header with Title & Add Part Button */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#1e293b]">Parts & Hardware Line Items</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#116dff]">
            {partsLineItems.length} {partsLineItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        {!isCompleted && (
          <button
            type="button"
            onClick={onOpenAddPartModal}
            className="flex items-center gap-2 px-5 h-10 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-semibold rounded-full text-sm transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Part
          </button>
        )}
      </div>

      {partsLineItems.length > 0 ? (
        <div className={tableShellClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Part name</th>
                <th className={`${thClass} w-16 text-center`}>Qty</th>
                <th className={`${thClass} w-24 text-right`}>Unit price</th>
                <th className={`${thClass} w-24 text-right`}>Discount</th>
                <th className={`${thClass} w-28 text-right`}>GST / Tax</th>
                <th className={`${thClass} w-28 text-right`}>Line total</th>
                <th className={`${thClass} w-16 text-right`} aria-label="Actions">Actions</th>
              </tr>
            </thead>
            <tbody className={tbodyDivide}>
              {partsLineItems.map((part) => (
                <tr key={part.id} className="hover:bg-[#f8fafc]">
                  <td className="px-4 py-3.5 font-bold text-[#1e293b]">{part.description}</td>
                  <td className="px-4 py-3.5 text-center text-[#64748b] font-semibold">{parseFloat(String(part.quantity))}</td>
                  <td className="px-4 py-3.5 text-right text-[#64748b] font-mono font-medium">₹{parseFloat(String(part.unitPrice)).toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-right text-rose-600 font-mono font-medium">
                    {parseFloat(String(part.discountAmount || 0)) > 0 ? `-₹${parseFloat(String(part.discountAmount)).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#64748b] font-mono text-xs">
                    {part.taxMode !== 'NONE' ? `₹${parseFloat(String(part.taxAmount)).toFixed(2)} (${parseFloat(String(part.taxRate))}% ${part.taxMode})` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#1e293b] font-mono font-bold">
                    ₹{parseFloat(String(part.lineTotal)).toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => onDeletePart(part.id)}
                        className="p-1 text-[#94a3b8] hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all inline-flex items-center justify-center"
                        title="Remove part"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#f8fafc] font-semibold border-t border-[#e2e8f0]">
                <td className="px-4 py-3.5 text-[#64748b]" colSpan={5}>
                  Parts subtotal
                </td>
                <td className="px-4 py-3.5 text-[#116dff] font-mono text-right font-bold" colSpan={2}>
                  ₹{totalPartsCost.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-2xl border border-dashed border-[#cbd5e1] text-center">
          <img
            src="/assets/no-parts.png"
            alt="No parts added"
            className="w-56 sm:w-64 h-auto mx-auto mb-3 object-contain"
          />
          <h4 className="text-base font-bold text-[#1e293b] mb-1">No parts added</h4>
          <p className="text-xs text-[#64748b] max-w-sm mb-5">
            No parts or hardware items have been added to this ticket yet. Click below to add line items.
          </p>
          {!isCompleted && (
            <button
              type="button"
              onClick={onOpenAddPartModal}
              className="flex items-center gap-2 px-5 h-10 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-semibold rounded-full text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Part
            </button>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center justify-between w-full p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#64748b] mt-4">
          <span className="flex items-center gap-2 font-semibold text-amber-600">
            <Lock className="w-4 h-4" /> Ticket Completed & Sealed
          </span>
          <span>Part line items are locked and cannot be added or modified.</span>
        </div>
      )}
    </div>
  );
};
