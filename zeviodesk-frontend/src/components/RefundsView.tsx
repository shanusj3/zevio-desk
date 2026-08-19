import React from 'react';
import { RefreshCw, Search, ShieldAlert } from 'lucide-react';

export const RefundsView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Refunds & Credit Notes</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">Manage customer return refunds, cancellations, and credit adjustments</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1b2536] bg-[#101622] overflow-hidden p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
          <RefreshCw className="w-6 h-6 text-amber-400" />
        </div>
        <h3 className="text-sm font-bold text-white">Refund Management Module</h3>
        <p className="text-xs text-[#64748B] max-w-sm mx-auto">
          No pending refunds. Customer refunds and voided invoice reversals will appear here.
        </p>
      </div>
    </div>
  );
};
