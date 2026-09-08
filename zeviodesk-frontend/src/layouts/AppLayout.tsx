import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useAppStore } from '../store/useAppStore';
import { useInvoicingSettingsQuery } from '../hooks/useInvoicesQuery';
import { applyAndCacheTheme, getTenantCacheKey } from '../lib/theme';
import { getSocketClient } from '../lib/socket';
import { ActiveTab } from '../types';

function getRoutePathForTab(tab: ActiveTab, defaultPath?: string): string {
  if (defaultPath) return defaultPath;
  switch (tab) {
    case 'dashboard': return '/dashboard';
    case 'tickets': return '/tickets';
    case 'customers': return '/customers';
    case 'staff': return '/staff';
    case 'settings': return '/settings';
    case 'whatsapp': return '/inbox';
    case 'catalog-products': return '/catalog/products';
    case 'catalog-categories': return '/catalog/categories';
    case 'catalog-inventory': return '/catalog/inventory';
    case 'reports':
    case 'reports-highlights': return '/reports/highlights';
    case 'reports-repairs': return '/reports/repairs';
    case 'reports-financials': return '/reports/financials';
    case 'reports-inventory': return '/reports/inventory';
    default: return `/${tab}`;
  }
}

export const AppLayout: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, showToast } = useAppStore();
  const { data: invoicingSettings } = useInvoicingSettingsQuery();
  const role = currentUser?.role ?? '';
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Derive current tenant slug from subdomain (mirrors LoginPage.getDetectedSlug)
  const tenantSlug = React.useMemo(() => {
    const host = window.location.hostname;
    const parts = host.split('.');
    const searchParams = new URLSearchParams(window.location.search);
    const paramSlug = searchParams.get('tenant');
    if (paramSlug) return paramSlug;
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
      return parts[0];
    }
    return null;
  }, []);

  // On mount: immediately apply any cached theme from localStorage to avoid
  // a flash of the default #116dff before invoicingSettings query resolves.
  useEffect(() => {
    const slug = tenantSlug ?? window.location.hostname;
    const cacheKey = getTenantCacheKey(slug);
    try {
      const cached = localStorage.getItem(cacheKey) ||
        localStorage.getItem(`zevio_theme_${window.location.hostname}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.primaryColor) {
          applyAndCacheTheme(parsed, slug);
        }
      }
    } catch (_) { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

  // Cache & apply tenant theme synchronously to DOM & localStorage
  useEffect(() => {
    if (invoicingSettings) {
      applyAndCacheTheme({
        primaryColor: invoicingSettings.primaryColor || '#116dff',
        logoUrl: invoicingSettings.logoUrl,
      }, tenantSlug ?? undefined);
    }
  }, [invoicingSettings, tenantSlug]);

  // Real-time socket notification listener for assigned tickets
  useEffect(() => {
    const socket = getSocketClient();
    if (!socket) return;

    const handleTicketAssigned = (data: any) => {
      const ticketNum = data.ticketNumber || data.jobNumber || 'Ticket';
      const title = data.title || '';

      if (data.assignedToId === currentUser?.id || data.isDirectAssignment) {
        showToast(`⚡ New Ticket Assigned to You: ${ticketNum} - ${title}`, 'info');
      } else {
        showToast(`⚡ Ticket Created: ${ticketNum} - ${title}`, 'info');
      }

      // Invalidate queries so technician/advisor view updates live
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    };

    socket.on('ticket:assigned', handleTicketAssigned);
    return () => {
      socket.off('ticket:assigned', handleTicketAssigned);
    };
  }, [currentUser?.id, queryClient, showToast]);

  // Sync activeTab state when URL changes
  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith('/customers')) setActiveTab('customers');
    else if (p.startsWith('/staff')) setActiveTab('staff');
    else if (p.startsWith('/settings')) setActiveTab('settings');
    else if (p.startsWith('/catalog/products')) setActiveTab('catalog-products');
    else if (p.startsWith('/catalog/categories')) setActiveTab('catalog-categories');
    else if (p.startsWith('/catalog/inventory')) setActiveTab('catalog-inventory');
    else if (p.startsWith('/inbox')) setActiveTab('whatsapp');
    else if (p.startsWith('/reports/repairs')) setActiveTab('reports-repairs');
    else if (p.startsWith('/reports/financials')) setActiveTab('reports-financials');
    else if (p.startsWith('/reports/inventory')) setActiveTab('reports-inventory');
    else if (p.startsWith('/reports')) setActiveTab('reports-highlights');
    else if (p.startsWith('/tickets')) setActiveTab('tickets');
    else setActiveTab('dashboard');
  }, [location.pathname, setActiveTab]);

  return (
    <div className="flex h-screen bg-[#f4f7fb] overflow-hidden text-[#1e293b]">
      {/* Sidebar Component Shell */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab, path) => {
          setActiveTab(tab);
          const targetPath = getRoutePathForTab(tab, path);
          navigate(targetPath);
        }}
        currentUser={{
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          avatar: '',
          role: role,
        }}
      />

      {/* Main App Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Header */}
        <Header
          notifications={[]}
          onMarkNotificationRead={() => {}}
          onClearNotifications={() => {}}
          currentUser={{
            name: currentUser?.name || '',
            email: currentUser?.email || '',
            avatar: '',
            role: role,
          }}
        />

        {/* Scrollable Main View Slot - React Router DOM Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
