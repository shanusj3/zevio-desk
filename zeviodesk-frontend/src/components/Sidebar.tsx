import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { ActiveTab } from '../types';
import { useInvoicingSettingsQuery } from '../hooks/useInvoicesQuery';
import { ticketsApi } from '../lib/api';
import {
  LayoutDashboard, Store, BarChart3, Ticket, Users, UserCheck, Settings, Package,
  ChevronDown, ChevronRight, ShoppingBag, Tag, MessageSquare, TrendingUp, IndianRupee,
  Wrench, PlusCircle, CheckCircle2, Truck
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab, path?: string) => void;
  currentUser: {
    name: string;
    email: string;
    avatar: string;
    role: string;
  };
  readyPickupCount?: number;
}

interface SubMenuItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  path: string;
  isActive: boolean;
  badge?: number;
  badgeColor?: string;
}

interface SidebarNavAccordionProps {
  label: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  isAccordionActive: boolean;
  items: SubMenuItem[];
  onSelectSubItem: (id: ActiveTab, path: string) => void;
}

const SidebarNavAccordion: React.FC<SidebarNavAccordionProps> = ({
  label,
  icon: Icon,
  isOpen,
  onToggle,
  isAccordionActive,
  items,
  onSelectSubItem,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  }, []);

  const handleMouseEnterHeader = () => {
    clearHideTimeout();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setFlyoutPos({ top: rect.top + rect.height / 2, left: rect.right + 1 });
    }
    setIsHovered(true);
  };

  const handleMouseLeaveHeader = () => {
    hideTimeout.current = setTimeout(() => setIsHovered(false), 120);
  };

  const handleMouseEnterFlyout = () => {
    clearHideTimeout();
  };

  const handleMouseLeaveFlyout = () => {
    hideTimeout.current = setTimeout(() => setIsHovered(false), 120);
  };

  const handleHeaderClick = () => {
    clearHideTimeout();
    setIsHovered(false);
    onToggle();
  };

  const subBtn = (isActive: boolean) =>
    `w-full flex items-center gap-2.5 pl-10 pr-6 py-2 text-xs font-medium transition-colors duration-150 text-left outline-none select-none cursor-pointer ${
      isActive
        ? 'bg-[#2B2E36] text-white font-semibold'
        : 'text-[#cfd0d2] hover:text-white hover:bg-[#2B2E36]'
    }`;

  return (
    <div className={`my-1 transition-all relative ${isOpen ? 'bg-[#181C26] pb-1' : ''}`}>
      {/* Header Button */}
      <button
        ref={buttonRef}
        onMouseEnter={handleMouseEnterHeader}
        onMouseLeave={handleMouseLeaveHeader}
        onClick={handleHeaderClick}
        className={`w-full flex items-center gap-3 px-6 py-2.5 text-[13px] font-medium transition-colors duration-150 cursor-pointer select-none ${
          isOpen || isHovered || isAccordionActive
            ? 'bg-[#2B2E36] text-white font-semibold'
            : 'text-[#cfd0d2] hover:text-white hover:bg-[#2B2E36]'
        }`}
      >
        <Icon className={`w-4 h-4 ${isOpen || isHovered || isAccordionActive ? 'text-white' : 'text-[#cfd0d2]'}`} />
        <span>{label}</span>
        <span className="ml-auto">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#cfd0d2]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#cfd0d2]" />
          )}
        </span>
      </button>

      {/* Expanded Inline Sub-links */}
      {isOpen && (
        <div className="mt-0.5 space-y-0 animate-in slide-in-from-top-2 duration-150">
          {items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id + item.path}
                onClick={() => {
                  clearHideTimeout();
                  setIsHovered(false);
                  onSelectSubItem(item.id, item.path);
                }}
                className={subBtn(item.isActive)}
              >
                <ItemIcon className={`w-3.5 h-3.5 ${item.isActive ? 'text-white' : 'text-[#cfd0d2]'}`} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-auto min-w-5 h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${
                      item.badgeColor || 'bg-[#116dff]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Hover Flyout Portal (When Accordion is Closed) */}
      {!isOpen && isHovered && createPortal(
        <div
          onMouseEnter={handleMouseEnterFlyout}
          onMouseLeave={handleMouseLeaveFlyout}
          style={{ top: flyoutPos.top, left: flyoutPos.left - 8, transform: 'translateY(-50%)' }}
          className="fixed z-[9999] font-sans flex items-stretch animate-in fade-in duration-150"
        >
          <div className="w-2 flex items-center pointer-events-none">
            <div className="w-0 h-0 border-y-[7px] border-y-transparent border-r-[8px] border-r-[#1F222B]" />
          </div>

          <div className="w-52 bg-[#1F222B] border-y border-r border-[#2e3444] rounded-xl shadow-2xl overflow-hidden py-1.5">
            {items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={`flyout-${item.id}-${item.path}`}
                  onClick={() => {
                    clearHideTimeout();
                    setIsHovered(false);
                    onSelectSubItem(item.id, item.path);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors text-left cursor-pointer ${
                    item.isActive
                      ? 'bg-[#2B2E36] text-white font-semibold'
                      : 'text-[#cfd0d2] hover:text-white hover:bg-[#2B2E36]'
                  }`}
                >
                  <ItemIcon className="w-3.5 h-3.5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-auto min-w-5 h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${
                        item.badgeColor || 'bg-[#116dff]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const isCatalogTab = (tab: ActiveTab) =>
  tab === 'catalog-products' || tab === 'catalog-inventory' || tab === 'catalog-categories';

const isReportsTab = (tab: ActiveTab) =>
  tab === 'reports' || tab === 'reports-highlights' || tab === 'reports-repairs' || tab === 'reports-financials' || tab === 'reports-inventory';

const isTicketsRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path.startsWith('/tickets') && path !== '/tickets/my-repairs' && path !== '/tickets/my-repairs/';
};

function getInitialLogoUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const initial = (window as any).__INITIAL_THEME__?.logoUrl;
    if (initial) return initial;
    const hostname = window.location.hostname;
    const cached = localStorage.getItem(`zevio_theme_${hostname}`) ||
                   localStorage.getItem('zevio_theme_default');
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.logoUrl || null;
    }
  } catch (e) {}
  return null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  readyPickupCount = 0,
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isTechnician = currentUser.role === 'TECHNICIAN';

  const { data: invoicingSettings, isLoading: isInvoicingLoading } = useInvoicingSettingsQuery();
  const cachedLogo = getInitialLogoUrl();
  const tenantLogo = invoicingSettings?.logoUrl !== undefined ? invoicingSettings.logoUrl : cachedLogo;

  // Real-time badge counts for administrative queues
  const { data: repairCompletedList = [] } = useQuery({
    queryKey: ['repair-completed'],
    queryFn: ticketsApi.repairCompleted,
    enabled: !isTechnician && !isSuperAdmin,
    staleTime: 1000 * 30,
  });

  const { data: readyPickupList = [] } = useQuery({
    queryKey: ['ready-for-pickup'],
    queryFn: ticketsApi.readyForPickup,
    enabled: !isTechnician && !isSuperAdmin,
    staleTime: 1000 * 30,
  });

  const repairCompletedBadge = repairCompletedList.length;
  const readyPickupBadge = readyPickupList.length || readyPickupCount;

  // Accordion open states
  const [ticketsOpen, setTicketsOpen] = useState(isTicketsRoute());
  const [catalogOpen, setCatalogOpen] = useState(isCatalogTab(activeTab));
  const [reportsOpen, setReportsOpen] = useState(isReportsTab(activeTab));

  // Automatically synchronize accordion open states
  useEffect(() => {
    if (isTicketsRoute()) {
      setTicketsOpen(true);
      setCatalogOpen(false);
      setReportsOpen(false);
    } else if (isCatalogTab(activeTab)) {
      setCatalogOpen(true);
      setTicketsOpen(false);
      setReportsOpen(false);
    } else if (isReportsTab(activeTab)) {
      setReportsOpen(true);
      setTicketsOpen(false);
      setCatalogOpen(false);
    }
  }, [activeTab]);

  let menuItems: { id: ActiveTab; label: string; icon: React.ElementType; path?: string; badge?: number }[] = [];

  if (isSuperAdmin) {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'tenants', label: 'Tenants', icon: Store, path: '/tenants' },
    ];
  } else if (isTechnician) {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'tickets', label: 'My Repairs', icon: Wrench, path: '/tickets/my-repairs' },
      { id: 'whatsapp', label: 'Inbox', icon: MessageSquare, path: '/inbox' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ];
  } else if (currentUser.role === 'ADVISOR') {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'whatsapp', label: 'Inbox', icon: MessageSquare, path: '/inbox' },
      { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
    ];
  } else if (currentUser.role === 'MANAGER') {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'whatsapp', label: 'Inbox', icon: MessageSquare, path: '/inbox' },
      { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
      { id: 'staff', label: 'Shop Staff', icon: UserCheck, path: '/staff' },
    ];
  } else {
    // TENANT_ADMIN — full access
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'whatsapp', label: 'Inbox', icon: MessageSquare, path: '/inbox' },
      { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
      { id: 'staff', label: 'Shop Staff', icon: UserCheck, path: '/staff' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ];
  }

  const hasTicketsAccordion = !isSuperAdmin && !isTechnician;
  const hasCatalog = !isSuperAdmin && !isTechnician;
  const hasReports = !isSuperAdmin && !isTechnician && currentUser.role !== 'ADVISOR';

  // Shared nav button style
  const navBtn = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-6 py-2.5 text-[13px] font-medium transition-colors duration-150 text-left outline-none select-none cursor-pointer ${
      isActive
        ? 'bg-[#2B2E36] text-white font-semibold'
        : 'text-[#cfd0d2] hover:text-white hover:bg-[#2B2E36]'
    }`;

  return (
    <aside className="w-64 bg-[#131720] border-r border-[#1e2535] flex flex-col justify-between h-screen select-none transition-all duration-200 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#131720] [&::-webkit-scrollbar-thumb]:bg-[#9C9EA6] hover:[&::-webkit-scrollbar-thumb]:bg-[#b0b2ba]">
      <div>
        {/* Logo */}
        <div className="h-14 px-6 flex items-center gap-2.5 border-b border-[#1e2535] shrink-0">
          {tenantLogo ? (
            <img src={tenantLogo} alt="Tenant Logo" className="h-8 max-w-[190px] object-contain" />
          ) : isSuperAdmin || (!isInvoicingLoading && !tenantLogo) ? (
            <img src="/zeviodesk-brand-header.png" alt="ZevioDesk Logo" className="h-8 object-contain" />
          ) : (
            <div className="h-8 w-36 bg-[#1a202c] rounded-lg animate-pulse" />
          )}
        </div>

        {/* Nav Items */}
        <nav className="py-4">
          {/* 1. Dashboard (ALWAYS FIRST) */}
          {menuItems.filter(item => item.id === 'dashboard').map((item, i) => {
            const Icon = item.icon;
            const isActive = activeTab === 'dashboard' || window.location.pathname === '/dashboard' || window.location.pathname === '/';

            return (
              <button
                key={`dashboard-${i}`}
                onClick={() => {
                  setCatalogOpen(false);
                  setReportsOpen(false);
                  setTicketsOpen(false);
                  setActiveTab(item.id, item.path);
                }}
                className={navBtn(isActive)}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#cfd0d2]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* 2. Expandable Tickets Accordion */}
          {hasTicketsAccordion && (
            <SidebarNavAccordion
              label="Tickets"
              icon={Ticket}
              isOpen={ticketsOpen}
              isAccordionActive={isTicketsRoute()}
              onToggle={() => {
                const next = !ticketsOpen;
                setTicketsOpen(next);
                if (next) {
                  setCatalogOpen(false);
                  setReportsOpen(false);
                }
              }}
              onSelectSubItem={(tab, path) => {
                setTicketsOpen(true);
                setCatalogOpen(false);
                setReportsOpen(false);
                setActiveTab(tab, path);
              }}
              items={[
                {
                  id: 'tickets',
                  label: 'All Tickets',
                  icon: Ticket,
                  path: '/tickets',
                  isActive: window.location.pathname === '/tickets' || window.location.pathname === '/tickets/',
                },
                {
                  id: 'tickets',
                  label: 'Create Ticket',
                  icon: PlusCircle,
                  path: '/tickets/new',
                  isActive: window.location.pathname === '/tickets/new' || window.location.pathname === '/tickets/create',
                },
                {
                  id: 'tickets',
                  label: 'Repair Completed',
                  icon: CheckCircle2,
                  path: '/tickets/repair-completed',
                  isActive: window.location.pathname.startsWith('/tickets/repair-completed'),
                  badge: repairCompletedBadge,
                  badgeColor: 'bg-indigo-600',
                },
                {
                  id: 'tickets',
                  label: 'Ready for Pickup',
                  icon: Truck,
                  path: '/tickets/ready-for-pickup',
                  isActive: window.location.pathname.startsWith('/tickets/ready-for-pickup'),
                  badge: readyPickupBadge,
                  badgeColor: 'bg-[#116dff]',
                },
              ]}
            />
          )}

          {/* 3. Remaining Navigation Items (Inbox, Customers, Staff, Settings) */}
          {menuItems.filter(item => item.id !== 'dashboard').map((item, i) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.path && window.location.pathname === item.path);

            return (
              <button
                key={`${item.id}-${i}`}
                onClick={() => {
                  setCatalogOpen(false);
                  setReportsOpen(false);
                  setTicketsOpen(false);
                  setActiveTab(item.id, item.path);
                }}
                className={navBtn(isActive)}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#cfd0d2]'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-[#116dff] text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* 4. Reports Accordion */}
          {hasReports && (
            <SidebarNavAccordion
              label="Reports"
              icon={BarChart3}
              isOpen={reportsOpen}
              isAccordionActive={isReportsTab(activeTab)}
              onToggle={() => {
                const next = !reportsOpen;
                setReportsOpen(next);
                if (next) {
                  setTicketsOpen(false);
                  setCatalogOpen(false);
                  setActiveTab('reports-highlights', '/reports/highlights');
                }
              }}
              onSelectSubItem={(tab, path) => {
                setReportsOpen(true);
                setTicketsOpen(false);
                setCatalogOpen(false);
                setActiveTab(tab, path);
              }}
              items={[
                {
                  id: 'reports-highlights',
                  label: 'Highlights',
                  icon: TrendingUp,
                  path: '/reports/highlights',
                  isActive: activeTab === 'reports-highlights' || activeTab === 'reports',
                },
                {
                  id: 'reports-repairs',
                  label: 'Repair Operations',
                  icon: Ticket,
                  path: '/reports/repairs',
                  isActive: activeTab === 'reports-repairs',
                },
                {
                  id: 'reports-financials',
                  label: 'Financials & Billing',
                  icon: IndianRupee,
                  path: '/reports/financials',
                  isActive: activeTab === 'reports-financials',
                },
                {
                  id: 'reports-inventory',
                  label: 'Inventory & Stock',
                  icon: Package,
                  path: '/reports/inventory',
                  isActive: activeTab === 'reports-inventory',
                },
              ]}
            />
          )}

          {/* 5. Catalog Accordion */}
          {hasCatalog && (
            <SidebarNavAccordion
              label="Catalog"
              icon={ShoppingBag}
              isOpen={catalogOpen}
              isAccordionActive={isCatalogTab(activeTab)}
              onToggle={() => {
                const next = !catalogOpen;
                setCatalogOpen(next);
                if (next) {
                  setTicketsOpen(false);
                  setReportsOpen(false);
                  setActiveTab('catalog-products', '/catalog/products');
                }
              }}
              onSelectSubItem={(tab, path) => {
                setCatalogOpen(true);
                setTicketsOpen(false);
                setReportsOpen(false);
                setActiveTab(tab, path);
              }}
              items={[
                {
                  id: 'catalog-products',
                  label: 'Products',
                  icon: ShoppingBag,
                  path: '/catalog/products',
                  isActive: activeTab === 'catalog-products',
                },
                {
                  id: 'catalog-inventory',
                  label: 'Inventory',
                  icon: Package,
                  path: '/catalog/inventory',
                  isActive: activeTab === 'catalog-inventory',
                },
                {
                  id: 'catalog-categories',
                  label: 'Categories',
                  icon: Tag,
                  path: '/catalog/categories',
                  isActive: activeTab === 'catalog-categories',
                },
              ]}
            />
          )}
        </nav>
      </div>
    </aside>
  );
};
