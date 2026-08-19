import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StatCard } from './StatCard';
import { TicketsTable } from './TicketsTable';
import { TicketDetailsPage } from './TicketDetailsPage';
import { EditTicketPage } from './EditTicketPage';
import { CustomersTable } from './CustomersTable';
import { EmployeesTable } from './EmployeesTable';
import { CreateCustomerModal } from './CreateCustomerModal';
import { CreateEmployeeModal } from './CreateEmployeeModal';
import { ProfilePage } from './ProfilePage';
import { ItemCatalogSettings } from './ItemCatalogSettings';
import { InvoiceTemplateSettings } from './InvoiceTemplateSettings';
import { GenerateInvoicePage } from './GenerateInvoicePage';
import { ReadyForPickupPage } from './ReadyForPickupPage';
import { SalesDomainView } from './SalesDomainView';
import { TenantReportsView } from './TenantReportsView';
import { Customer, TenantUser, ticketsApi } from '../lib/api';
import { useTicketsQuery, useTicketQuery } from '../hooks/useTicketsQuery';
import { navigate, parseTicketRoute, ticketDetailPath, ticketEditPath, ticketBillingPath } from '../lib/navigation';
import { useDeleteCustomerMutation } from '../hooks/useCustomersQuery';
import { useDeleteUserMutation } from '../hooks/useUsersQuery';
import { ActiveTab } from '../types';
import { useAppStore } from '../store/useAppStore';
import { MessageSquare, Plus, Loader2, Settings, Database, Receipt } from 'lucide-react';
import { DateFilter } from './DateFilter';
import { DateFilterOption, DateRange, getDateRangeParams } from '../lib/filterUtils';
import { getRoleDefaultStatuses } from '../lib/ticketDisplay';

export const TenantAdminDashboard: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, showToast } = useAppStore();
  const [pathname, setPathname] = useState(window.location.pathname);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<TenantUser | null>(null);
  const [dateOption, setDateOption] = useState<DateFilterOption>('THIS_MONTH');
  const [customRange, setCustomRange] = useState<DateRange>({ startDate: null, endDate: null });

  const ticketRoute = parseTicketRoute(pathname);
  const ticketId = ticketRoute?.view === 'detail' || ticketRoute?.view === 'edit' || ticketRoute?.view === 'billing'
    ? ticketRoute.ticketId
    : '';
  const { data: routedTicket, isLoading: ticketLoading, isError: ticketError } = useTicketQuery(ticketId);
  const deleteCustomerMutation = useDeleteCustomerMutation();
  const deleteUserMutation = useDeleteUserMutation();

  const role = currentUser?.role ?? '';
  const dateParams = getDateRangeParams(dateOption, customRange);
  const roleDefaultStatuses = getRoleDefaultStatuses(role);
  const [settingsTab, setSettingsTab] = useState<'general' | 'invoicing'>('general');

  // Fetch tickets filtered by date + role-default statuses from backend
  const { data: tickets = [] } = useTicketsQuery({
    ...(role === 'TECHNICIAN' || role === 'ADVISOR' ? {} : dateParams),
    ...(roleDefaultStatuses ? { statusIn: roleDefaultStatuses } : {}),
  });
  const { data: readyForPickupTickets = [] } = useQuery({
    queryKey: ['ready-for-pickup'],
    queryFn: ticketsApi.readyForPickup,
    enabled: role !== 'TECHNICIAN',
  });

  // ── Role-specific stat computations ─────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const countStatus = (s: string) => tickets.filter(t => t.status === s).length;
  const deliveredToday = tickets.filter(t =>
    t.status === 'COMPLETED' && new Date(t.updatedAt) >= today
  ).length;

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  useEffect(() => {
    const updatePathname = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsSidebarOpen]);

  const sidebarUser = {
    name: currentUser?.name || 'Tenant Admin',
    email: currentUser?.email || 'admin@yourcompany.com',
    avatar: getInitials(currentUser?.name || 'Tenant Admin'),
    role: currentUser?.role || 'TENANT_ADMIN',
  };

  // ── Customer handlers ────────────────────────────────────────────────────
  const handleOpenCreateCustomer = () => {
    setCustomerToEdit(null);
    setIsCustomerModalOpen(true);
  };
  const handleEditCustomer = (c: Customer) => {
    setCustomerToEdit(c);
    setIsCustomerModalOpen(true);
  };
  const handleDeleteCustomer = async (c: Customer) => {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    try {
      await deleteCustomerMutation.mutateAsync(c.id);
      showToast('Customer deleted', 'info');
    } catch (e: any) {
      showToast(e.message || 'Failed to delete customer', 'warning');
    }
  };

  // ── Employee handlers ────────────────────────────────────────────────────
  const handleOpenCreateEmployee = () => {
    setEmployeeToEdit(null);
    setIsEmployeeModalOpen(true);
  };
  const handleEditEmployee = (u: TenantUser) => {
    setEmployeeToEdit(u);
    setIsEmployeeModalOpen(true);
  };
  const handleDeleteEmployee = async (u: TenantUser) => {
    if (!window.confirm(`Remove "${u.name}" from the team? This cannot be undone.`)) return;
    try {
      await deleteUserMutation.mutateAsync(u.id);
      showToast('Employee removed', 'info');
    } catch (e: any) {
      showToast(e.message || 'Failed to remove employee', 'warning');
    }
  };

  // ── Create Ticket shortcut ───────────────────────────────────────────────
  const handleOpenCreateTicket = () => {
    navigate('/tickets/new');
  };

  const goToTicketsList = () => navigate('/tickets');

  if (ticketRoute?.view === 'detail') {
    if (ticketLoading) {
      return (
        <div className="min-h-screen bg-[#090e17] flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-8 h-8 animate-spin text-[#D99B26]" />
        </div>
      );
    }
    if (ticketError || !routedTicket) {
      return (
        <div className="min-h-screen bg-[#090e17] flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-white font-semibold">Ticket not found</p>
          <p className="text-sm text-[#64748B]">This ticket may have been removed or you do not have access.</p>
          <button
            type="button"
            onClick={goToTicketsList}
            className="px-4 py-2 rounded-lg bg-[#D99B26] text-[#0d121c] font-bold text-sm cursor-pointer"
          >
            Back to tickets
          </button>
        </div>
      );
    }
    return (
      <TicketDetailsPage
        ticket={routedTicket}
        onBack={goToTicketsList}
        onEdit={() => navigate(ticketEditPath(routedTicket.id))}
      />
    );
  }

  if (ticketRoute?.view === 'edit') {
    if (ticketLoading) {
      return (
        <div className="min-h-screen bg-[#090e17] flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-8 h-8 animate-spin text-[#D99B26]" />
        </div>
      );
    }
    if (ticketError || !routedTicket) {
      return (
        <div className="min-h-screen bg-[#090e17] flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-white font-semibold">Ticket not found</p>
          <button
            type="button"
            onClick={goToTicketsList}
            className="px-4 py-2 rounded-lg bg-[#D99B26] text-[#0d121c] font-bold text-sm cursor-pointer"
          >
            Back to tickets
          </button>
        </div>
      );
    }
    return (
      <EditTicketPage
        ticket={routedTicket}
        onBack={() => navigate(ticketDetailPath(routedTicket.id))}
        onSuccess={() => navigate(ticketDetailPath(routedTicket.id))}
      />
    );
  }

  if (ticketRoute?.view === 'billing') {
    if (ticketLoading) {
      return (
        <div className="min-h-screen bg-[#090e17] flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-8 h-8 animate-spin text-[#D99B26]" />
        </div>
      );
    }
    if (ticketError || !routedTicket) {
      return (
        <div className="min-h-screen bg-[#090e17] flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-white font-semibold">Ticket not found</p>
          <button
            type="button"
            onClick={goToTicketsList}
            className="px-4 py-2 rounded-lg bg-[#D99B26] text-[#0d121c] font-bold text-sm cursor-pointer"
          >
            Back to tickets
          </button>
        </div>
      );
    }
    return (
      <GenerateInvoicePage
        ticket={routedTicket}
        onBack={() => navigate(ticketDetailPath(routedTicket.id))}
        onSuccess={() => navigate(ticketDetailPath(routedTicket.id))}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1017] text-[#e2e8f0] flex flex-col md:flex-row antialiased selection:bg-[#D99B26]/30 overflow-x-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out shrink-0 w-64 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeTab={
            pathname.startsWith('/sales')
              ? 'sales'
              : activeTab
          }
          setActiveTab={(tab: ActiveTab, path?: string) => {
            const paths: Record<ActiveTab, string> = {
              dashboard: '/dashboard',
              tickets: '/tickets',
              invoices: '/billing/invoices',
              billing: '/billing/invoices',
              sales: '/sales',
              customers: '/customers',
              staff: '/staff',
              settings: '/settings',
              tenants: '/dashboard',
              reports: '/reports',
              profile: '/profile'
            };
            setActiveTab(tab);
            // Navigate to the item's specific path if provided (e.g. /tickets/ready-for-pickup),
            // otherwise fall back to the generic tab path. Only one popstate fires per click.
            navigate(path || paths[tab] || '/dashboard');
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          currentUser={sidebarUser}
          readyPickupCount={readyForPickupTickets.length}
        />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <Header
          notifications={[]}
          onMarkNotificationRead={() => {}}
          onClearNotifications={() => {}}
          currentUser={sidebarUser}
          toggleSidebarMobile={() => setIsSidebarOpen(!isSidebarOpen)}
          onProfileClick={() => { navigate('/profile'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
        />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">

          {/* ── DASHBOARD ────────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && !ticketRoute && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {role === 'TECHNICIAN' ? 'My Work' : role === 'ADVISOR' ? 'Need Attention' : 'Shop Overview'}
                  </h1>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    {role === 'TECHNICIAN'
                      ? 'Tickets assigned to you in active repair stages'
                      : role === 'ADVISOR'
                      ? 'Tickets needing customer interaction today'
                      : 'Track and manage tickets and metrics for your store'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {role !== 'TECHNICIAN' && role !== 'ADVISOR' && (
                    <DateFilter option={dateOption} setOption={setDateOption} customRange={customRange} setCustomRange={setCustomRange} />
                  )}
                  {role !== 'TECHNICIAN' && (
                    <button
                      onClick={handleOpenCreateTicket}
                      className="flex items-center gap-2 px-4 h-10 bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#D99B26]/10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      New Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Role-specific stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {role === 'TECHNICIAN' ? (
                  <>
                    <StatCard type="tech_newReceived" value={countStatus('RECEIVED')} />
                    <StatCard type="tech_diagnosing" value={countStatus('DIAGNOSING')} />
                    <StatCard type="tech_waitingParts" value={countStatus('WAITING_FOR_PARTS')} />
                    <StatCard type="tech_inProgress" value={countStatus('IN_PROGRESS')} />
                  </>
                ) : role === 'ADVISOR' ? (
                  <>
                    <StatCard type="adv_newReceived" value={countStatus('RECEIVED')} />
                    <StatCard type="adv_readyPickup" value={countStatus('READY_FOR_PICKUP')} />
                    <StatCard type="adv_deliveredToday" value={deliveredToday} />
                    <StatCard type="inProgressTickets" value={countStatus('IN_PROGRESS')} />
                  </>
                ) : (
                  <>
                    <StatCard type="totalTickets" value={tickets.length} />
                    <StatCard type="waitingParts" value={countStatus('WAITING_FOR_PARTS')} />
                    <StatCard type="readyPickup" value={countStatus('READY_FOR_PICKUP')} />
                    <StatCard type="deliveredToday" value={deliveredToday} />
                  </>
                )}
              </div>

              <TicketsTable
                filteredTickets={tickets}
                onSelectTicket={(t) => navigate(ticketDetailPath(t.id))}
                onEditTicket={(t) => navigate(ticketEditPath(t.id))}
              />
            </div>
          )}

          {/* ── TICKETS ──────────────────────────────────────────────────────── */}
          {ticketRoute?.view === 'ready-for-pickup' && <ReadyForPickupPage />}

          {activeTab === 'tickets' && !ticketRoute && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Tickets</h1>
                  <p className="text-xs text-[#94A3B8] mt-1">All repair jobs in your workshop</p>
                </div>
                <button
                  onClick={handleOpenCreateTicket}
                  className="flex items-center gap-2 px-4 h-10 bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#D99B26]/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  New Ticket
                </button>
              </div>
              <TicketsTable onSelectTicket={(t) => navigate(ticketDetailPath(t.id))} onEditTicket={(t) => navigate(ticketEditPath(t.id))} />
            </div>
          )}

          {/* ──── PROFILE ──────────────────────────────────────────────────────── */}
          {activeTab === 'profile' && !ticketRoute && (
            <ProfilePage />
          )}

          {/* ──── BILLING ──────────────────────────────────────────────────────── */}
          {/* ──── SALES ────────────────────────────────────────────────────────── */}
          {(activeTab === 'sales' || pathname.startsWith('/sales')) && !ticketRoute && (
            <SalesDomainView />
          )}

          {/* ──── CUSTOMERS ───────────────────────────────────────────────────── */}
          {activeTab === 'customers' && !ticketRoute && currentUser?.role !== 'TECHNICIAN' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Customers Directory</h1>
                  <p className="text-xs text-[#94A3B8] mt-1">Manage customer profiles for your workshop</p>
                </div>
                <button
                  onClick={handleOpenCreateCustomer}
                  className="flex items-center gap-2 px-4 h-10 bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#D99B26]/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </button>
              </div>
              <CustomersTable
                onEditCustomer={handleEditCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            </div>
          )}

          {/* ──── STAFF ───────────────────────────────────────────────────────── */}
          {activeTab === 'staff' && !ticketRoute && currentUser?.role !== 'ADVISOR' && currentUser?.role !== 'TECHNICIAN' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Shop Staff</h1>
                  <p className="text-xs text-[#94A3B8] mt-1">Manage technicians, advisors, and other team members</p>
                </div>
                <button
                  onClick={handleOpenCreateEmployee}
                  className="flex items-center gap-2 px-4 h-10 bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#D99B26]/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Employee
                </button>
              </div>
              <EmployeesTable
                onEditEmployee={handleEditEmployee}
                onDeleteEmployee={handleDeleteEmployee}
              />
            </div>
          )}

          {/* ──── SETTINGS ────────────────────────────────────────────────────── */}
          {activeTab === 'settings' && !ticketRoute && currentUser?.role !== 'ADVISOR' && currentUser?.role !== 'TECHNICIAN' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Preferences &amp; Settings</h1>
                <p className="text-xs text-[#94A3B8] mt-1">Configure integrations and details for your shop</p>
              </div>

              {/* Settings Tabs */}
              <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-[#0d1322] p-1 w-fit">
                <button
                  onClick={() => setSettingsTab('general')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                    settingsTab === 'general'
                      ? 'bg-[#d9a743] text-[#0d121c] shadow'
                      : 'text-[#64748B] hover:text-white'
                  }`}
                >
                  <Settings className="size-3.5" />
                  General
                </button>
                <button
                  onClick={() => setSettingsTab('invoicing')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                    settingsTab === 'invoicing'
                      ? 'bg-[#d9a743] text-[#0d121c] shadow'
                      : 'text-[#64748B] hover:text-white'
                  }`}
                >
                  <Receipt className="size-3.5" />
                  Invoicing
                </button>
              </div>

              {/* General Settings Panel */}
              {settingsTab === 'general' && (
                <div className="rounded-2xl border border-[#1b2536] bg-[#101622] p-8 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#d9a743]/10">
                      <Settings className="size-5 text-[#d9a743]" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">General Settings</h2>
                      <p className="text-xs text-[#64748B] mt-0.5">Shop name, contact details, and regional preferences</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { label: 'Shop Name', placeholder: 'Your repair shop name', id: 'setting-shop-name' },
                      { label: 'Business Email', placeholder: 'contact@yourshop.com', id: 'setting-email' },
                      { label: 'Phone Number', placeholder: '+1 (555) 000-0000', id: 'setting-phone' },
                      { label: 'Business Address', placeholder: '123 Main St, City, Country', id: 'setting-address' },
                    ].map(({ label, placeholder, id }) => (
                      <div key={id}>
                        <label htmlFor={id} className="mb-2 block text-xs font-semibold text-[#CBD5E1]">{label}</label>
                        <input
                          id={id}
                          type="text"
                          placeholder={placeholder}
                          disabled
                          className="h-11 w-full rounded-xl border border-white/[0.06] bg-[#141b2b] px-3 text-sm text-[#475569] placeholder:text-[#2d3748] outline-none cursor-not-allowed"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-[#d9a743]/20 bg-[#1a1608]/60 px-4 py-3">
                    <p className="text-xs text-[#d9a743] font-medium">General settings configuration coming soon.</p>
                    <p className="text-xs text-[#64748B] mt-0.5">Shop profile and regional preferences will be editable here.</p>
                  </div>
                </div>
              )}

              {/* Invoicing Panel */}
              {settingsTab === 'invoicing' && (
                <div className="rounded-2xl border border-[#1b2536] bg-[#101622] p-6">
                  <InvoiceTemplateSettings />
                </div>
              )}
            </div>
          )}

          {/* ──── REPORTS ──────────────────────────────────────────────────────── */}
          {activeTab === 'reports' && !ticketRoute && (
            <TenantReportsView />
          )}
        </main>
      </div>

      {/* ── Drawers & Modals ───────────────────────────────────────────────── */}



      <CreateCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => { setIsCustomerModalOpen(false); setCustomerToEdit(null); }}
        customerToEdit={customerToEdit}
      />

      <CreateEmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => { setIsEmployeeModalOpen(false); setEmployeeToEdit(null); }}
        employeeToEdit={employeeToEdit}
      />
    </div>
  );
};
