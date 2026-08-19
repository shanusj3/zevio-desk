import React from 'react';
import { FileText, CreditCard, RefreshCw, Plus } from 'lucide-react';
import { InvoicesPage } from './InvoicesPage';
import { NewInvoicePage } from './NewInvoicePage';
import { InvoiceDetailView } from './InvoiceDetailView';
import { PaymentsView } from './PaymentsView';
import { RefundsView } from './RefundsView';
import {
  parseBillingRoute,
  navigate,
  billingInvoicesPath,
  billingPaymentsPath,
  billingRefundsPath,
  billingOutstandingPath,
  invoiceDetailPath,
} from '../lib/navigation';
import { InvoiceListItem } from '../lib/api';

export const BillingDomainView: React.FC = () => {
  const pathname = window.location.pathname;
  const route = parseBillingRoute(pathname) || { section: 'invoices', view: 'list' };

  // Handle invoice detail page
  if (route.section === 'invoices' && route.view === 'detail' && 'invoiceId' in route) {
    return (
      <InvoiceDetailView
        invoiceId={route.invoiceId}
        onBack={() => navigate(billingInvoicesPath())}
      />
    );
  }

  // Handle new invoice page
  if (route.section === 'invoices' && route.view === 'new') {
    return (
      <NewInvoicePage
        onBack={() => navigate(billingInvoicesPath())}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Domain Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b2536] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Invoicing</h1>
          <p className="text-xs text-[#94A3B8] mt-1">Top-level domain for invoices, payments, and financial management</p>
        </div>

        {/* Domain Sub-Navigation Tabs */}
        <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-[#0d1322] p-1 shrink-0">
          <button
            onClick={() => navigate(billingInvoicesPath())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              route.section === 'invoices'
                ? 'bg-[#D99B26] text-[#0d121c] shadow'
                : 'text-[#64748B] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Invoices
          </button>
          <button
            onClick={() => navigate(billingPaymentsPath())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              route.section === 'payments'
                ? 'bg-[#D99B26] text-[#0d121c] shadow'
                : 'text-[#64748B] hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Payments
          </button>
          <button
            onClick={() => navigate(billingRefundsPath())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              route.section === 'refunds'
                ? 'bg-[#D99B26] text-[#0d121c] shadow'
                : 'text-[#64748B] hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refunds
          </button>
          <button
            onClick={() => navigate(billingOutstandingPath())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${route.section === 'outstanding' ? 'bg-[#D99B26] text-[#0d121c] shadow' : 'text-[#64748B] hover:text-white'}`}
          >
            Outstanding
          </button>
        </div>
      </div>

      {/* Section Content */}
      {route.section === 'payments' && <PaymentsView />}
      {route.section === 'refunds' && <RefundsView />}
      {route.section === 'outstanding' && <InvoicesPage outstandingOnly onNewInvoice={() => navigate('/billing/invoices/new')} onSelectInvoice={(inv: InvoiceListItem) => navigate(invoiceDetailPath(inv.id))} />}
      {route.section === 'invoices' && (
        <InvoicesPage
          onNewInvoice={() => navigate('/billing/invoices/new')}
          onSelectInvoice={(inv: InvoiceListItem) => navigate(invoiceDetailPath(inv.id))}
        />
      )}
    </div>
  );
};
