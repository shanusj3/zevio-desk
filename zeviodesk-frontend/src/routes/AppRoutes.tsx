import React from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardOverviewTab } from '../pages/DashboardOverviewTab';
import { CustomersTab } from '../pages/CustomersTab';
import { StaffTab } from '../pages/StaffTab';
import { SettingsView } from '../pages/SettingsView';
import { CatalogProductsPage } from '../pages/CatalogProductsPage';
import { CreateProductPage } from '../pages/CreateProductPage';
import { CatalogCategoriesPage } from '../pages/CatalogCategoriesPage';
import { InventoryPage } from '../pages/InventoryPage';
import { WhatsAppInbox } from '../pages/WhatsAppInbox';
import { TenantReportsView } from '../pages/TenantReportsView';
import { TicketDetailsPage } from '../pages/TicketDetailsPage';
import { EditTicketPage } from '../pages/EditTicketPage';
import { CreateTicketPage } from '../pages/CreateTicketPage';
import { GenerateInvoicePage } from '../pages/GenerateInvoicePage';
import { TicketsTab } from '../pages/TicketsTab';
import { ReadyForPickupPage } from '../pages/ReadyForPickupPage';
import { useTicketQuery } from '../hooks/useTicketsQuery';
import { TicketDetailsSkeleton } from '../components/TicketDetailsSkeleton';
import { RepairCompletedPage } from '../pages/RepairCompletedPage';
import { MyRepairsPage } from '../pages/MyRepairsPage';
import { useAppStore } from '../store/useAppStore';

// Route Wrapper for Ticket Details
const TicketDetailsRoute: React.FC = () => {
  const { ticketId = '' } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { data: ticket, isLoading } = useTicketQuery(ticketId);

  if (isLoading || !ticket) return <TicketDetailsSkeleton onBack={() => navigate(-1)} />;

  return (
    <TicketDetailsPage
      ticket={ticket}
      onBack={() => navigate(-1)}
      onEdit={(t) => navigate(`/tickets/${t.id}/edit`)}
    />
  );
};

// Route Wrapper for Ticket Edit
const TicketEditRoute: React.FC = () => {
  const { ticketId = '' } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { data: ticket } = useTicketQuery(ticketId);

  if (!ticket) return <div className="p-6 text-center text-[#64748b]">Loading ticket for edit...</div>;

  return (
    <EditTicketPage
      ticket={ticket}
      onBack={() => navigate(-1)}
      onSuccess={() => navigate(`/tickets/${ticket.id}`)}
    />
  );
};

// Route Wrapper for Ticket Billing Invoice
const TicketBillingRoute: React.FC = () => {
  const { ticketId = '' } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { data: ticket } = useTicketQuery(ticketId);

  if (!ticket) return <div className="p-6 text-center text-[#64748b]">Loading ticket for invoice...</div>;

  return (
    <GenerateInvoicePage
      ticket={ticket}
      onBack={() => navigate(-1)}
      onSuccess={() => navigate(`/tickets/${ticket.id}`)}
    />
  );
};

// Route Wrapper for Product Edit
const EditProductRoute: React.FC = () => {
  const { productId = '' } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  return (
    <CreateProductPage
      productId={productId}
      onBack={() => navigate('/catalog/products')}
    />
  );
};

// Settings Wrapper
const SettingsRouteWrapper: React.FC = () => {
  const location = useLocation();
  return <SettingsView pathname={location.pathname} />;
};

// Admin Queue Guard (Redirects Technicians to My Repairs)
const AdminQueueGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAppStore();
  if (currentUser?.role === 'TECHNICIAN') {
    return <MyRepairsPage />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* ── Full Screen Billing View (NO SIDEBAR) ── */}
      <Route path="tickets/:ticketId/billing" element={<TicketBillingRoute />} />

      {/* ── App Shell Layout with React Router DOM <Outlet /> ── */}
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <DashboardOverviewTab
              onOpenCreateTicket={() => navigate('/tickets/new')}
              onOpenWhatsAppModal={() => navigate('/settings/whatsapp')}
            />
          }
        />
        <Route
          path="dashboard"
          element={
            <DashboardOverviewTab
              onOpenCreateTicket={() => navigate('/tickets/new')}
              onOpenWhatsAppModal={() => navigate('/settings/whatsapp')}
            />
          }
        />
        <Route path="customers" element={<CustomersTab />} />
        <Route path="staff" element={<StaffTab />} />
        <Route path="settings/*" element={<SettingsRouteWrapper />} />

        <Route path="catalog/products" element={<CatalogProductsPage />} />
        <Route
          path="catalog/products/new"
          element={<CreateProductPage onBack={() => navigate('/catalog/products')} />}
        />
        <Route
          path="catalog/products/:productId"
          element={<EditProductRoute />}
        />
        <Route path="catalog/categories" element={<CatalogCategoriesPage />} />
        <Route path="catalog/categories/:categoryId" element={<CatalogCategoriesPage />} />
        <Route path="catalog/inventory" element={<InventoryPage />} />

        <Route path="tickets" element={<TicketsTab />} />
        <Route path="tickets/new" element={<CreateTicketPage onBack={() => navigate(-1)} />} />
        <Route path="tickets/my-repairs" element={<MyRepairsPage />} />
        <Route
          path="tickets/repair-completed"
          element={
            <AdminQueueGuard>
              <RepairCompletedPage />
            </AdminQueueGuard>
          }
        />
        <Route
          path="tickets/ready-for-pickup"
          element={
            <AdminQueueGuard>
              <ReadyForPickupPage />
            </AdminQueueGuard>
          }
        />
        <Route path="tickets/:ticketId" element={<TicketDetailsRoute />} />
        <Route path="tickets/:ticketId/edit" element={<TicketEditRoute />} />

        <Route path="inbox" element={<WhatsAppInbox />} />
        <Route path="reports/highlights" element={<TenantReportsView initialTab="overview" />} />
        <Route path="reports/repairs" element={<TenantReportsView initialTab="tickets" />} />
        <Route path="reports/financials" element={<TenantReportsView initialTab="revenue" />} />
        <Route path="reports/inventory" element={<TenantReportsView initialTab="inventory" />} />
        <Route path="reports/*" element={<TenantReportsView initialTab="overview" />} />
      </Route>
    </Routes>
  );
};
