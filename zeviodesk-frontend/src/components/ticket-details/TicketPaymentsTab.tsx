import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Payment } from '../../lib/api';

interface TicketPaymentsTabProps {
  payments: Payment[];
  isCompleted: boolean;
  onOpenRecordPaymentModal: () => void;
  onDeletePayment: (payment: Payment) => void;
}

const tableShellClass = 'overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-xs';
const tableClass = 'w-full text-left text-sm';
const theadClass = 'bg-[#f8fafc] border-b border-[#e2e8f0]';
const thClass = 'px-4 py-3 font-bold text-xs tracking-wider uppercase text-[#64748b] whitespace-nowrap';
const tbodyDivide = 'divide-y divide-[#e2e8f0]';

export const TicketPaymentsTab: React.FC<TicketPaymentsTabProps> = ({
  payments,
  isCompleted,
  onOpenRecordPaymentModal,
  onDeletePayment,
}) => {
  const upiSum = payments.filter((p) => p.method === 'UPI').reduce((s, p) => s + Number(p.amount || 0), 0);
  const cardSum = payments.filter((p) => p.method === 'CARD').reduce((s, p) => s + Number(p.amount || 0), 0);
  const cashSum = payments.filter((p) => p.method === 'CASH').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPaid = upiSum + cardSum + cashSum;

  return (
    <div className="space-y-4">
      {/* Top Section Header with Title & Record Payment Button */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#1e293b]">Payment Transactions</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#116dff]">
            {payments.length} {payments.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        {!isCompleted && (
          <button
            type="button"
            onClick={onOpenRecordPaymentModal}
            className="px-3.5 py-2 bg-[#116dff] hover:bg-[#2563eb] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        )}
      </div>

      {/* Breakdown Pill Badges */}
      <div className="flex items-center gap-2.5 flex-wrap text-xs">
        <div className="px-4 py-1.5 rounded-full bg-[#116dff] text-white font-bold flex items-center gap-1.5 font-mono shadow-xs">
          Total Paid: <span>₹{totalPaid.toFixed(2)}</span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-[#10b981] text-white font-bold flex items-center gap-1.5 font-mono shadow-xs">
          UPI: <span>₹{upiSum.toFixed(2)}</span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-[#3b82f6] text-white font-bold flex items-center gap-1.5 font-mono shadow-xs">
          Card: <span>₹{cardSum.toFixed(2)}</span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-[#8b5cf6] text-white font-bold flex items-center gap-1.5 font-mono shadow-xs">
          Cash: <span>₹{cashSum.toFixed(2)}</span>
        </div>
      </div>

      {payments.length > 0 ? (
        <div className={tableShellClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Date & Time</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Method</th>
                <th className={thClass}>Notes</th>
                <th className={`${thClass} text-right`}>Amount</th>
                {!isCompleted && <th className={`${thClass} text-center w-12`}></th>}
              </tr>
            </thead>
            <tbody className={tbodyDivide}>
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-[#f8fafc]">
                  <td className="px-4 py-3.5 text-xs text-[#64748b] font-mono whitespace-nowrap">
                    {new Date(p.paidAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.type === 'ADVANCE'
                          ? 'bg-purple-100 text-purple-700'
                          : p.type === 'PARTS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[#1e293b] text-xs">{p.method}</td>
                  <td className="px-4 py-3.5 text-xs text-[#64748b]">{p.notes || '—'}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-[#1e293b]">
                    ₹{Number(p.amount).toFixed(2)}
                  </td>
                  {!isCompleted && (
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onDeletePayment(p)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Payment Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-2xl border border-dashed border-[#cbd5e1] text-center">
          <img
            src="/assets/no-payments.png"
            alt="No payments recorded"
            className="w-56 sm:w-64 h-auto mx-auto mb-3 object-contain"
          />
          <h4 className="text-base font-bold text-[#1e293b] mb-1">No payments recorded yet</h4>
          <p className="text-xs text-[#64748b] max-w-sm mb-5">
            No payment transactions have been logged for this ticket yet. Click below to record a payment.
          </p>
          {!isCompleted && (
            <button
              type="button"
              onClick={onOpenRecordPaymentModal}
              className="flex items-center gap-2 px-5 h-10 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-semibold rounded-full text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          )}
        </div>
      )}
    </div>
  );
};
