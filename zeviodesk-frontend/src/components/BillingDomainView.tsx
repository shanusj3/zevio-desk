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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Billing & Invoicing</h1>
          <p className="text-xs text-[#64748B] mt-1">Top-level domain for invoices, payments, and financial management</p>
        </div>

        {/* Domain Sub-Navigation Tabs */}
        <div className="flex gap-1 rounded-xl border border-[#e2e8f0] bg-white p-1 shrink-0 shadow-sm">
          <button
            onClick={() => navigate(billingInvoicesPath())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              route.section === 'invoices'
                ? 'bg-[#116dff] text-white shadow'
                : 'text-[#64748B] hover:text-[#1e293b]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Invoices
          </button>
          <button
            onClick={() => navigate(billingPaymentsPath())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              route.section === 'payments'
                ? 'bg-[#116dff] text-white shadow'
                : 'text-[#64748B] hover:text-[#1e293b]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Payments
          </button>
          <button
            onClick={() => navigate(billingRefundsPath())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              route.section === 'refunds'
                ? 'bg-[#116dff] text-white shadow'
                : 'text-[#64748B] hover:text-[#1e293b]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refunds
          </button>
          <button
            onClick={() => navigate(billingOutstandingPath())}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${route.section === 'outstanding' ? 'bg-[#116dff] text-white shadow' : 'text-[#64748B] hover:text-[#1e293b]'}`}
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
