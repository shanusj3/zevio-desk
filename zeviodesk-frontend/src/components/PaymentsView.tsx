import React, { useState } from 'react';
import { CreditCard, Search, Banknote, QrCode, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { request } from '../lib/api';
import { formatCurrency } from '../utils/formatters';

const fmt = (n: number | string) =>
  formatCurrency(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const PaymentsView: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: payments = [], isLoading } = useQuery<any[]>({
    queryKey: ['billing-all-payments'],
    queryFn: () => request('/invoices?paymentStatus=ALL'),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Payments Register</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">Track all recorded customer payments across tickets and direct billing</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1b2536] bg-[#101622] overflow-hidden">
        <div className="p-4 border-b border-[#1b2536]">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search payments by customer or ticket..."
              className="w-full h-9 pl-9 pr-4 bg-[#0d1322] border border-white/[0.07] rounded-xl text-xs text-white placeholder:text-[#475569] outline-none"
            />
          </div>
        </div>

        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D99B26]/10 flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6 text-[#D99B26]" />
          </div>
          <h3 className="text-sm font-bold text-white">Canonical Payment Ledger</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            All ticket advance deposits, partial settlements, and final payment transactions are indexed here under the canonical billing domain.
          </p>
        </div>
      </div>
    </div>
  );
};
