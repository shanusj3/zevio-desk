import React, { useState, useMemo } from 'react';
import {
  FileText, Plus, Search, ChevronRight, Clock,
  CheckCircle2, AlertCircle, Loader2, IndianRupee
} from 'lucide-react';
import { useInvoicesListQuery } from '../hooks/useInvoicesQuery';
import { InvoiceListItem } from '../lib/api';

type PaymentFilter = 'ALL' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

interface InvoicesPageProps {
  onNewInvoice: () => void;
  onSelectInvoice: (invoice: InvoiceListItem) => void;
  outstandingOnly?: boolean;
}

const fmt = (n: string | number) => `₹${parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const FILTER_TABS: { id: PaymentFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'UNPAID', label: 'Unpaid' },
  { id: 'PARTIALLY_PAID', label: 'Partial' },
  { id: 'PAID', label: 'Paid' },
];

const PaymentBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'PAID') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="w-2.5 h-2.5" /> PAID
    </span>
  );
  if (status === 'PARTIALLY_PAID') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <Clock className="w-2.5 h-2.5" /> PARTIAL
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
      <AlertCircle className="w-2.5 h-2.5" /> UNPAID
    </span>
  );
};

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ onNewInvoice, onSelectInvoice, outstandingOnly = false }) => {
  const [filter, setFilter] = useState<PaymentFilter>(outstandingOnly ? 'UNPAID' : 'ALL');
  const [search, setSearch] = useState('');

  const { data: invoices = [], isLoading } = useInvoicesListQuery({
    paymentStatus: outstandingOnly || filter === 'ALL' ? undefined : filter,
  });

  const filtered = useMemo(() => {
    const candidates = outstandingOnly ? invoices.filter(inv => inv.paymentStatus !== 'PAID') : invoices;
    if (!search.trim()) return candidates;
    const term = search.toLowerCase();
    return candidates.filter(inv =>
      inv.ticket?.customer?.name?.toLowerCase().includes(term) ||
      inv.ticket?.customer?.phone?.includes(term) ||
      (inv.invoiceNumber ?? '').toLowerCase().includes(term) ||
      (inv.ticket?.jobNumber ?? '').toLowerCase().includes(term)
    );
  }, [invoices, search]);

  // Summary counts
  const unpaidCount = invoices.filter(i => i.paymentStatus === 'UNPAID').length;
  const partialCount = invoices.filter(i => i.paymentStatus === 'PARTIALLY_PAID').length;
  const totalBalance = invoices.reduce((s, i) => s + parseFloat(i.balanceDue || '0'), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{outstandingOnly ? 'Outstanding Payments' : 'Invoices'}</h1>
          <p className="text-xs text-[#94A3B8] mt-1">{outstandingOnly ? 'Invoices with an amount still due' : 'Billing workspace — collect payments & manage invoices'}</p>
        </div>
        <button
          id="new-invoice-btn"
          onClick={onNewInvoice}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D99B26] hover:bg-[#c48c21] text-[#0d121c] font-semibold text-sm rounded-xl transition-all shadow-lg shadow-[#D99B26]/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {/* Summary Cards */}
      {!isLoading && invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#1b2536] bg-[#101622] px-5 py-4">
            <p className="text-xs text-[#64748B] font-medium">Unpaid</p>
            <p className="text-xl font-bold text-red-400 mt-1">{unpaidCount}</p>
            <p className="text-[10px] text-[#475569] mt-0.5">invoices outstanding</p>
          </div>
          <div className="rounded-2xl border border-[#1b2536] bg-[#101622] px-5 py-4">
            <p className="text-xs text-[#64748B] font-medium">Partial</p>
            <p className="text-xl font-bold text-amber-400 mt-1">{partialCount}</p>
            <p className="text-[10px] text-[#475569] mt-0.5">partially collected</p>
          </div>
          <div className="rounded-2xl border border-[#1b2536] bg-[#101622] px-5 py-4">
            <p className="text-xs text-[#64748B] font-medium">Balance Due</p>
            <p className="text-xl font-bold text-white mt-1">{fmt(totalBalance)}</p>
            <p className="text-[10px] text-[#475569] mt-0.5">across all invoices</p>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="rounded-2xl border border-[#1b2536] bg-[#101622] overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 border-b border-[#1b2536]">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
            <input
              id="invoices-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice, customer, phone, ticket..."
              className="w-full h-10 pl-9 pr-4 bg-[#0d1322] border border-white/[0.07] rounded-xl text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#D99B26]/50 transition"
            />
          </div>
          {/* Filter tabs */}
          {!outstandingOnly && <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-[#0d1322] p-1 shrink-0">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                id={`invoice-filter-${tab.id.toLowerCase()}`}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#D99B26] text-[#0d121c] shadow'
                    : 'text-[#64748B] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#D99B26]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#D99B26]/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-[#D99B26]" />
            </div>
            <p className="text-sm font-semibold text-white">No invoices found</p>
            <p className="text-xs text-[#475569] max-w-xs">
              {invoices.length === 0
                ? 'Click "+ New Invoice" to start billing a repair ticket.'
                : 'Try a different search term or filter.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1b2536]">
            {/* Column headers */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">
              <span>Invoice</span>
              <span>Customer</span>
              <span>Ticket</span>
              <span>Total</span>
              <span>Status</span>
              <span />
            </div>
            {filtered.map(inv => (
              <button
                key={inv.id}
                id={`invoice-row-${inv.id}`}
                onClick={() => onSelectInvoice(inv)}
                className="w-full grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition text-left group cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-[#D99B26] transition">
                    {inv.invoiceNumber ?? <span className="text-[#475569] italic text-xs">Draft</span>}
                  </p>
                  <p className="text-[10px] text-[#475569] mt-0.5">
                    {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white font-medium truncate">
                    {inv.ticket?.customer?.name ?? <span className="text-[#475569]">—</span>}
                  </p>
                  <p className="text-[10px] text-[#475569] mt-0.5 truncate">{inv.ticket?.customer?.phone ?? ''}</p>
                </div>
                <div>
                  {inv.ticket?.jobNumber ? (
                    <p className="text-xs text-[#94A3B8] font-mono">{inv.ticket.jobNumber}</p>
                  ) : (
                    <span className="text-[#475569] text-xs">—</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{fmt(inv.total)}</p>
                  {parseFloat(inv.balanceDue) > 0 && (
                    <p className="text-[10px] text-red-400 mt-0.5">due {fmt(inv.balanceDue)}</p>
                  )}
                </div>
                <div>
                  <PaymentBadge status={inv.paymentStatus} />
                </div>
                <ChevronRight className="w-4 h-4 text-[#475569] group-hover:text-[#D99B26] transition shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
