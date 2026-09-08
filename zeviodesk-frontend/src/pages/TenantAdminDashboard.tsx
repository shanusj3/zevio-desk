import React, { useEffect, useState } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { TicketDetailsPage } from './TicketDetailsPage';
import { EditTicketPage } from './EditTicketPage';
import { CreateTicketPage } from './CreateTicketPage';
import { GenerateInvoicePage } from './GenerateInvoicePage';
import { ReadyForPickupPage } from './ReadyForPickupPage';
import { TenantReportsView } from './TenantReportsView';
import { InventoryPage } from './InventoryPage';
import { CatalogCategoriesPage } from './CatalogCategoriesPage';
import { CreateProductPage } from './CreateProductPage';
import { CatalogProductsPage } from './CatalogProductsPage';
import { WhatsAppInbox } from './WhatsAppInbox';

import { DashboardOverviewTab } from './DashboardOverviewTab';
import { CustomersTab } from './CustomersTab';
import { StaffTab } from './StaffTab';
import { SettingsView } from './SettingsView';

import { useTicketQuery } from '../hooks/useTicketsQuery';
import { parseTicketRoute } from '../lib/navigation';
import { useAppStore } from '../store/useAppStore';
import { TicketDetailsSkeleton } from '../components/TicketDetailsSkeleton';

export const TenantAdminDashboard: React.FC = () => {
  const { currentUser, activeTab } = useAppStore();
  const [pathname, setPathname] = useState(window.location.pathname);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const ticketRoute = parseTicketRoute(pathname);
  const ticketId = ticketRoute?.view === 'detail' || ticketRoute?.view === 'edit' || ticketRoute?.view === 'billing'
    ? ticketRoute.ticketId
    : '';

  const { data: routedTicket, isLoading: isTicketLoading } = useTicketQuery(ticketId);
  const role = currentUser?.role ?? '';

  return (
    <>
      {/* ──── ROUTED TICKET DETAIL & EDIT VIEWS ─────────────────────── */}
      {ticketRoute?.view === 'detail' && (
        <TicketDetailsPage
          ticket={routedTicket}
          isLoading={isTicketLoading || !routedTicket}
          onBack={() => window.history.back()}
          onEdit={(t) => {
            window.history.pushState({}, '', `/tickets/${t.id}/edit`);
            setPathname(`/tickets/${t.id}/edit`);
          }}
        />
      )}

      {ticketRoute?.view === 'edit' && routedTicket && (
        <EditTicketPage
          ticket={routedTicket}
          onBack={() => window.history.back()}
          onSuccess={() => window.history.back()}
        />
      )}

      {ticketRoute?.view === 'billing' && routedTicket && (
        <GenerateInvoicePage
          ticket={routedTicket}
          onBack={() => window.history.back()}
          onSuccess={() => window.history.back()}
        />
      )}

      {ticketRoute?.view === 'new' && (
        <CreateTicketPage onBack={() => window.history.back()} />
      )}

      {/* ──── MAIN TAB VIEWS ───────────────────────────────────────── */}
      {!ticketRoute && (
        <>
          {activeTab === 'dashboard' && (
            <DashboardOverviewTab
              onOpenCreateTicket={() => {
                window.history.pushState({}, '', '/tickets/new');
                setPathname('/tickets/new');
              }}
              onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
            />
          )}

          {activeTab === 'tickets' && (
            <DashboardOverviewTab
              onOpenCreateTicket={() => {
                window.history.pushState({}, '', '/tickets/new');
                setPathname('/tickets/new');
              }}
              onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
            />
          )}

          {activeTab === 'dashboard' && role !== 'TECHNICIAN' && <ReadyForPickupPage />}
          {activeTab === 'whatsapp' && <WhatsAppInbox />}
          {activeTab === 'customers' && role !== 'TECHNICIAN' && <CustomersTab />}
          {activeTab === 'staff' && role !== 'ADVISOR' && role !== 'TECHNICIAN' && <StaffTab />}
          {activeTab === 'settings' && role !== 'ADVISOR' && role !== 'TECHNICIAN' && (
            <SettingsView pathname={pathname} />
          )}

          {activeTab === 'catalog-products' && <CatalogProductsPage />}
          {activeTab === 'catalog-inventory' && <InventoryPage />}
          {activeTab === 'catalog-categories' && (
            pathname.startsWith('/catalog/products/new') ? (
              <CreateProductPage
                initialCategoryId={new URLSearchParams(window.location.search).get('category') || undefined}
                onBack={() => {
                  window.history.pushState({}, '', '/catalog/categories');
                  setPathname('/catalog/categories');
                }}
              />
            ) : (
              <CatalogCategoriesPage />
            )
          )}

          {(activeTab === 'reports' || activeTab === 'reports-highlights') && (
            <TenantReportsView initialTab="overview" />
          )}
          {activeTab === 'reports-repairs' && <TenantReportsView initialTab="tickets" />}
          {activeTab === 'reports-financials' && <TenantReportsView initialTab="revenue" />}
          {activeTab === 'reports-inventory' && <TenantReportsView initialTab="inventory" />}
        </>
      )}
    </>
  );
};
