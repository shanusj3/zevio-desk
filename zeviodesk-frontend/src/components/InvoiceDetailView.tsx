import React from 'react';
import { ArrowLeft, FileText, CheckCircle2, Clock, AlertCircle, Printer, Share2, Ticket, User, Calendar, IndianRupee } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { request, InvoiceListItem } from '../lib/api';
import { navigate, billingInvoicesPath } from '../lib/navigation';
import { formatCurrency } from '../utils/formatters';

interface InvoiceDetailViewProps {
  invoiceId: string;
  onBack?: () => void;
}

const fmt = (n: string | number) =>
  formatCurrency(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoiceId, onBack }) => {
  const { data: invoice, isLoading, isError } = useQuery<InvoiceListItem & { lineItemsSnapshot?: any[]; notes?: string; invoiceDate?: string }>({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: () => request(`/invoices/${invoiceId}`),
  });

  const handleBack = onBack || (() => navigate(billingInvoicesPath()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#D99B26] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-4 p-6 text-center bg-[#101622] rounded-2xl border border-[#1b2536]">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Invoice Not Found</h2>
        <p className="text-xs text-[#94A3B8]">The requested invoice #{invoiceId} could not be located.</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-[#D99B26] text-[#0d121c] font-semibold text-xs rounded-xl"
        >
          Return to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl bg-[#101622] border border-[#1b2536] text-[#94A3B8] hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {invoice.invoiceNumber || `Invoice #${invoice.id.slice(0, 8)}`}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                invoice.paymentStatus === 'PAID'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : invoice.paymentStatus === 'PARTIALLY_PAID'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {invoice.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Canonical Billing Resource • Issued {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 bg-[#101622] border border-[#1b2536] text-white text-xs font-semibold rounded-xl hover:bg-[#162032] transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Main Invoice Card */}
      <div className="bg-[#101622] border border-[#1b2536] rounded-2xl p-6 space-y-6">
        {/* Source & Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[#1b2536]">
          <div>
            <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider block mb-2">Billing Source</span>
            {invoice.ticket ? (
              <div className="flex items-center gap-3 bg-[#0d1322] border border-white/[0.06] p-3 rounded-xl">
                <Ticket className="w-5 h-5 text-[#D99B26]" />
                <div>
                  <p className="text-xs font-semibold text-white">Repair Ticket #{invoice.ticket.jobNumber || invoice.ticket.id.slice(0, 8)}</p>
                  <p className="text-[10px] text-[#64748B]">Status: {invoice.ticket.status}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-[#0d1322] border border-white/[0.06] p-3 rounded-xl">
                <FileText className="w-5 h-5 text-[#D99B26]" />
                <div>
                  <p className="text-xs font-semibold text-white">Direct Invoice / Sale</p>
                  <p className="text-[10px] text-[#64748B]">Source Type: Independent</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider block mb-2">Customer Details</span>
            <div className="bg-[#0d1322] border border-white/[0.06] p-3 rounded-xl flex items-center gap-3">
              <User className="w-5 h-5 text-[#94A3B8]" />
              <div>
                <p className="text-xs font-semibold text-white">{invoice.ticket?.customer?.name || 'Walk-in Customer'}</p>
                <p className="text-[10px] text-[#64748B]">{invoice.ticket?.customer?.phone || 'No phone provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0d1322] p-4 rounded-xl border border-white/[0.05]">
            <span className="text-[10px] text-[#64748B] font-medium">Invoice Total</span>
            <p className="text-lg font-bold text-white mt-1">{fmt(invoice.total)}</p>
          </div>
          <div className="bg-[#0d1322] p-4 rounded-xl border border-white/[0.05]">
            <span className="text-[10px] text-[#64748B] font-medium">Amount Paid</span>
            <p className="text-lg font-bold text-emerald-400 mt-1">{fmt(invoice.amountPaid)}</p>
          </div>
          <div className="bg-[#0d1322] p-4 rounded-xl border border-white/[0.05]">
            <span className="text-[10px] text-[#64748B] font-medium">Balance Due</span>
            <p className="text-lg font-bold text-amber-400 mt-1">{fmt(invoice.balanceDue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
