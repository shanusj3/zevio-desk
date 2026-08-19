import React from 'react';
import { ShoppingBag, Plus, ArrowLeft, Search } from 'lucide-react';
import { parseSalesRoute, navigate } from '../lib/navigation';

export const SalesDomainView: React.FC = () => {
  const pathname = window.location.pathname;
  const salesRoute = parseSalesRoute(pathname);

  if (salesRoute?.view === 'detail') {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sales')}
            className="p-2 rounded-xl bg-[#101622] border border-[#1b2536] text-[#94A3B8] hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Sale #{salesRoute.saleId}
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">Product Sale Details</p>
          </div>
        </div>

        <div className="bg-[#101622] border border-[#1b2536] rounded-2xl p-8 text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-[#D99B26] mx-auto" />
          <h2 className="text-base font-bold text-white">Product Sale Resource</h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Sales entities can generate invoices independently of repair tickets, using the canonical billing domain with <code className="text-[#D99B26]">sourceType: 'sale'</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Product & Walk-in Sales</h1>
          <p className="text-xs text-[#94A3B8] mt-1">Manage over-the-counter spare part and accessory sales</p>
        </div>
        <button
          onClick={() => navigate('/sales/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D99B26] text-[#0d121c] font-semibold text-xs rounded-xl shadow-lg shadow-[#D99B26]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Sale
        </button>
      </div>

      <div className="bg-[#101622] border border-[#1b2536] rounded-2xl p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#D99B26]/10 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7 text-[#D99B26]" />
        </div>
        <h2 className="text-base font-bold text-white">Sales & POS Workspace</h2>
        <p className="text-xs text-[#64748B] max-w-md mx-auto">
          This top-level domain handles point-of-sale items, spare parts sales, and direct customer billing decoupled from service tickets.
        </p>
      </div>
    </div>
  );
};
