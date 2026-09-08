import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { TenantsTable } from './components/TenantsTable';
import { TenantDetailsDrawer } from './components/TenantDetailsDrawer';
import { CreateTenantModal } from './components/CreateTenantModal';
import { ImportModal } from './components/ImportModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ReportsView } from './pages/ReportsView';
import { LoginPage } from './pages/LoginPage';
import { Tenant, ActiveTab } from './types';
import { CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import {
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useToggleTenantStatusMutation,
  useDeleteTenantMutation,
} from './hooks/useTenantsQuery';
import { useReportsQuery } from './hooks/useReportsQuery';
import { StatCardSkeleton } from './components/Skeleton';
import { SetupPasswordPage } from './pages/SetupPasswordPage';
import { TenantAdminDashboard } from './pages/TenantAdminDashboard';
import { AppRoutes } from './routes/AppRoutes';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { navigate, parseTicketRoute } from './lib/navigation';
import { authApi } from './lib/api';
import { PublicTrackingPage } from './pages/PublicTrackingPage';
import { PublicCustomerTrackingPage } from './pages/PublicCustomerTrackingPage';

function AppContent() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [tenantToToggleStatus, setTenantToToggleStatus] = useState<Tenant | null>(null);

  useEffect(() => {
    const updatePathname = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
  }, []);
  const {
    isAuthenticated,
    currentUser,
    isSidebarOpen,
    setIsSidebarOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedTenantForDetails,
    setSelectedTenantForDetails,
    selectedTenantForEdit,
    setSelectedTenantForEdit,
    isImportModalOpen,
    setIsImportModalOpen,
    notifications,
    addNotification,
    clearNotifications,
    toastMessage,
    showToast,
    clearToast,
  } = useAppStore();


  const { data: reportsData, isLoading: reportsLoading } = useReportsQuery();
  const createMutation = useCreateTenantMutation();
  const updateMutation = useUpdateTenantMutation();
  const toggleStatusMutation = useToggleTenantStatusMutation();
  const deleteMutation = useDeleteTenantMutation();


  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsSidebarOpen]);

 
  useEffect(() => {
    if (isAuthenticated && !currentUser) {
      authApi.me()
        .then((user) => {
          useAppStore.setState({ currentUser: user });
        })
        .catch(() => {
          useAppStore.getState().logout();
        })
        .finally(() => {
          setIsInitializingAuth(false);
        });
    } else {
      setIsInitializingAuth(false);
    }
  }, [isAuthenticated, currentUser]);

  if (isInitializingAuth) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex flex-col items-center justify-center text-[#1e293b]">
        <Loader2 className="w-8 h-8 animate-spin text-[#116dff] mb-3" />
        <p className="text-xs font-semibold text-[#64748b]">Loading your profile...</p>
      </div>
    );
  }


  const isSetupPasswordRoute = pathname === '/setup-password';
  const urlParams = new URLSearchParams(window.location.search);
  const setupToken = urlParams.get('token');
  const superAdminTabByPath: Record<string, ActiveTab> = { '/': 'dashboard', '/dashboard': 'dashboard', '/tenants': 'tenants', '/reports': 'reports' };
  const superAdminTab = superAdminTabByPath[pathname] || 'dashboard';

  if (isSetupPasswordRoute && setupToken) {
    return <SetupPasswordPage token={setupToken} />;
  }


  const isTrackingRoute = pathname.includes('/track');
  if (isTrackingRoute) {
    return <PublicCustomerTrackingPage />;
  }


  if (!isAuthenticated) {
    return <LoginPage />;
  }


  if (currentUser?.role !== 'SUPER_ADMIN') {
 
    const hostname = window.location.hostname;
    const hostParts = hostname.split('.');
    const searchParams = new URLSearchParams(window.location.search);
    const paramSlug = searchParams.get('tenant');
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isOnSubdomain = Boolean(paramSlug) || isLocalhost || (hostParts.length >= 2 && hostParts[0] !== 'www');

    const tenantRoles = ['TENANT_ADMIN', 'MANAGER', 'ADVISOR', 'TECHNICIAN'];
    if (isOnSubdomain && tenantRoles.includes(currentUser?.role as string)) {
      return <AppRoutes />;
    }


    return (
      <div className="min-h-screen bg-[#0c1017] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#101622] border border-[#1b2536] rounded-2xl shadow-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-[#7F1D1D]/30 rounded-full flex items-center justify-center mx-auto border border-[#EF4444]/30">
            <svg className="w-8 h-8 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Wrong Portal</h2>
          <p className="text-sm text-[#94A3B8]">
            This is the <span className="text-[#D99B26] font-semibold">Super Admin</span> portal. Your account (<span className="text-white font-medium">{currentUser?.role}</span>) does not have access here.
          </p>
          <p className="text-xs text-[#64748B]">
            Please use your shop's dedicated dashboard at your subdomain.
          </p>
          <button
            onClick={() => useAppStore.getState().logout()}
            className="mt-4 w-full h-11 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/30 rounded-xl text-sm font-semibold transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }


  const handleCreateOrUpdateTenant = (tenantData: Partial<Tenant>) => {
    if (selectedTenantForEdit) {
     
      updateMutation.mutate(
        {
          ...selectedTenantForEdit,
          ...tenantData,
        } as Tenant,
        {
          onSuccess: (updatedTenant) => {
            if (selectedTenantForDetails?.id === updatedTenant.id) {
              setSelectedTenantForDetails(updatedTenant);
            }
            showToast(`Tenant "${updatedTenant.name}" updated successfully.`, 'success');
            setIsCreateModalOpen(false);
            setSelectedTenantForEdit(null);
          },
          onError: (error: any) => {
            showToast(error?.message || 'Failed to update tenant.', 'warning');
          },
        }
      );
    } else {
   
      createMutation.mutate(tenantData, {
        onSuccess: (newTenant) => {
          addNotification({
            title: `New Tenant Created: ${newTenant.name}`,
            type: 'tenant_created',
          });
          showToast(`Tenant "${newTenant.name}" created successfully.`, 'success');
          setIsCreateModalOpen(false);
        },
        onError: (error: any) => {
          showToast(error?.message || 'Failed to create tenant.', 'warning');
        },
      });
    }
  };



  const handleToggleTenantStatus = (target: Tenant) => {
    setTenantToToggleStatus(target);
  };

  const handleConfirmToggleStatus = () => {
    if (!tenantToToggleStatus) return;
    const target = tenantToToggleStatus;
    toggleStatusMutation.mutate(target.id, {
      onSuccess: (updated) => {
        showToast(`Tenant "${target.name}" status changed to ${updated.status}.`, 'info');
        if (selectedTenantForDetails?.id === target.id) {
          setSelectedTenantForDetails(updated);
        }
        setTenantToToggleStatus(null);
      },
      onError: () => {
        showToast('Failed to update tenant status.', 'warning');
        setTenantToToggleStatus(null);
      },
    });
  };

  const handleDeleteTenant = (target: Tenant) => {
    setTenantToDelete(target);
  };

  const handleConfirmDelete = () => {
    if (!tenantToDelete) return;
    const target = tenantToDelete;
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        if (selectedTenantForDetails?.id === target.id) {
          setSelectedTenantForDetails(null);
        }
        showToast(`Tenant "${target.name}" deleted.`, 'warning');
        setTenantToDelete(null);
      },
      onError: () => {
        showToast('Failed to delete tenant.', 'warning');
        setTenantToDelete(null);
      },
    });
  };

  const handleImportSuccess = (count: number) => {
    showToast(`Successfully imported ${count} new tenants!`, 'success');
  };
  const headerUser = currentUser || {
    name: 'Super Admin',
    email: 'admin@zeviodesk.com',
    role: 'Super Admin',
    avatarUrl: undefined,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const userAvatar = headerUser.avatarUrl || getInitials(headerUser.name);

  return (
    <div className="min-h-screen bg-[#0c1017] text-[#e2e8f0] flex flex-col md:flex-row antialiased selection:bg-[#D99B26]/30 overflow-x-hidden">
   
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

    
      <div
        className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out shrink-0 w-64 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeTab={superAdminTab}
          setActiveTab={(tab: ActiveTab) => {
            const paths: Record<ActiveTab, string> = { dashboard: '/dashboard', tenants: '/tenants', reports: '/reports', tickets: '/dashboard', invoices: '/dashboard', billing: '/dashboard', sales: '/dashboard', customers: '/dashboard', staff: '/dashboard', settings: '/dashboard', profile: '/dashboard', inventory: '/dashboard', 'catalog-products': '/dashboard', 'catalog-inventory': '/dashboard', 'catalog-categories': '/dashboard', whatsapp: '/dashboard', 'reports-highlights': '/reports/highlights', 'reports-repairs': '/reports/repairs', 'reports-financials': '/reports/financials', 'reports-inventory': '/reports/inventory' };
            window.history.pushState({}, '', paths[tab]);
            window.dispatchEvent(new PopStateEvent('popstate'));
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          currentUser={{
            name: headerUser.name,
            email: headerUser.email,
            avatar: userAvatar,
            role: headerUser.role,
          }}
        />
      </div>

      {/* Main Content Workspace */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        {/* Top Header */}
        <Header
          onCreateTenantClick={() => {
            setSelectedTenantForEdit(null);
            setIsCreateModalOpen(true);
          }}
          notifications={notifications}
          onMarkNotificationRead={(id) => {
            useAppStore.setState((state) => ({
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
            }));
          }}
          onClearNotifications={clearNotifications}
          currentUser={{
            name: headerUser.name,
            email: headerUser.email,
            avatar: userAvatar,
            role: headerUser.role,
          }}
          toggleSidebarMobile={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Body View */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
            <>
              {superAdminTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Page Title Header */}
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      Dashboard
                    </h1>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Overview of your platform & shop network
                    </p>
                  </div>

                  {/* Stat Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {reportsLoading ? (
                      <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                      </>
                    ) : (
                      <>
                        <StatCard type="totalTenants" value={reportsData?.totalTenants || 0} />
                        <StatCard type="activeTenants" value={reportsData?.activeCount || 0} />
                        <StatCard type="inactiveTenants" value={reportsData?.inactiveCount || 0} />
                        <StatCard type="totalUsers" value={reportsData?.totalUsers || 0} />
                      </>
                    )}
                  </div>

                  {/* All Tenants Table */}
                  <TenantsTable
                    mode="dashboard"
                    onSelectTenant={(t) => setSelectedTenantForDetails(t)}
                    onEditTenant={(t) => {
                      setSelectedTenantForEdit(t);
                      setIsCreateModalOpen(true);
                    }}
                    onToggleTenantStatus={handleToggleTenantStatus}
                    onDeleteTenant={handleDeleteTenant}
                  />
                </div>
              )}

              {superAdminTab === 'tenants' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Page Title Header */}
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      Tenants
                    </h1>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Manage all tenants on the platform
                    </p>
                  </div>

                  {/* Full Tenants Table */}
                  <TenantsTable
                    mode="tenants"
                    onSelectTenant={(t) => setSelectedTenantForDetails(t)}
                    onEditTenant={(t) => {
                      setSelectedTenantForEdit(t);
                      setIsCreateModalOpen(true);
                    }}
                    onToggleTenantStatus={handleToggleTenantStatus}
                    onDeleteTenant={handleDeleteTenant}
                    onOpenImportModal={() => setIsImportModalOpen(true)}
                  />
                </div>
              )}

              {superAdminTab === 'reports' && <ReportsView />}
            </>
        </main>
      </div>

      {/* Tenant Details Drawer */}
      <TenantDetailsDrawer
        tenant={selectedTenantForDetails}
        onClose={() => setSelectedTenantForDetails(null)}
        onEdit={(t) => {
          setSelectedTenantForEdit(t);
          setIsCreateModalOpen(true);
        }}
      />

      {/* Add / Edit Tenant Modal */}
      <CreateTenantModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedTenantForEdit(null);
        }}
        onSubmit={handleCreateOrUpdateTenant}
        initialData={selectedTenantForEdit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Delete Tenant Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!tenantToDelete}
        title="Delete Tenant"
        message={`Are you sure you want to delete the tenant "${tenantToDelete?.name}"? This action is permanent and cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTenantToDelete(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* Toggle Status Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!tenantToToggleStatus}
        title={tenantToToggleStatus?.status === 'Active' ? 'Deactivate Tenant' : 'Activate Tenant'}
        message={`Are you sure you want to make "${tenantToToggleStatus?.name}" ${tenantToToggleStatus?.status === 'Active' ? 'inactive' : 'active'}?`}
        confirmText={tenantToToggleStatus?.status === 'Active' ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        type={tenantToToggleStatus?.status === 'Active' ? 'warning' : 'info'}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setTenantToToggleStatus(null)}
        isLoading={toggleStatusMutation.isPending}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#121824] border border-[#23314a] text-white text-xs px-4 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          {toastMessage.type === 'warning' ? (
            <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
          )}
          <span className="font-semibold">{toastMessage.text}</span>
          <button
            onClick={clearToast}
            className="text-[#64748B] hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}


