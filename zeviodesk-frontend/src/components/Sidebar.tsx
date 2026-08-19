import React from 'react';
import { ActiveTab } from '../types';
import { LayoutDashboard, Store, BarChart3, Ticket, Users, UserCheck, Settings } from 'lucide-react';

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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  readyPickupCount = 0,
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  let menuItems = [];
  if (isSuperAdmin) {
    menuItems = [
      { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'tenants' as ActiveTab, label: 'Tenants', icon: Store },
      { id: 'reports' as ActiveTab, label: 'Reports', icon: BarChart3 },
    ];
  } else if (currentUser.role === 'TECHNICIAN') {
    menuItems = [
      { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'tickets' as ActiveTab, label: 'All Tickets', icon: Ticket },
      { id: 'tickets' as ActiveTab, label: 'Ready for Pickup', icon: Ticket, path: '/tickets/ready-for-pickup', badge: readyPickupCount },
    ];
  } else if (currentUser.role === 'ADVISOR') {
    menuItems = [
      { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'tickets' as ActiveTab, label: 'All Tickets', icon: Ticket },
      { id: 'tickets' as ActiveTab, label: 'Ready for Pickup', icon: Ticket, path: '/tickets/ready-for-pickup', badge: readyPickupCount },
      { id: 'customers' as ActiveTab, label: 'Customers', icon: Users },
    ];
  } else if (currentUser.role === 'MANAGER') {
    menuItems = [
      { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'tickets' as ActiveTab, label: 'All Tickets', icon: Ticket },
      { id: 'tickets' as ActiveTab, label: 'Ready for Pickup', icon: Ticket, path: '/tickets/ready-for-pickup', badge: readyPickupCount },
      { id: 'customers' as ActiveTab, label: 'Customers', icon: Users },
      { id: 'staff' as ActiveTab, label: 'Shop Staff', icon: UserCheck },
      { id: 'reports' as ActiveTab, label: 'Reports', icon: BarChart3 },
    ];
  } else {
    // TENANT_ADMIN — full access including Billing
    menuItems = [
      { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'tickets' as ActiveTab, label: 'All Tickets', icon: Ticket },
      { id: 'tickets' as ActiveTab, label: 'Ready for Pickup', icon: Ticket, path: '/tickets/ready-for-pickup', badge: readyPickupCount },
      { id: 'customers' as ActiveTab, label: 'Customers', icon: Users },
      { id: 'staff' as ActiveTab, label: 'Shop Staff', icon: UserCheck },
      { id: 'reports' as ActiveTab, label: 'Reports', icon: BarChart3 },
      { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
    ];
  }

  return (
    <aside className="w-64 bg-[#0d121c] border-r border-[#192233] flex flex-col justify-between h-screen select-none transition-all duration-200">
      <div>
        {/* Logo Section */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#192233]/40">
          <img src="/logo.png" alt="Zevio Desk Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Zeviodesk
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isReadyForPickup = 'path' in item && item.path === '/tickets/ready-for-pickup';
            const isOnReadyForPickup = window.location.pathname === '/tickets/ready-for-pickup' || window.location.pathname === '/tickets/ready-for-pickup/';
            const isActive = isReadyForPickup
              ? isOnReadyForPickup
              : activeTab === item.id && !(item.id === 'tickets' && isOnReadyForPickup);
            return (
              <button
                key={item.id}
                onClick={() => {
                  // Always call setActiveTab so the parent owns navigation.
                  // Pass the item's specific path (e.g. /tickets/ready-for-pickup)
                  // so the parent navigates there directly — one popstate event only.
                  const itemPath = 'path' in item ? item.path : undefined;
                  setActiveTab(item.id, itemPath);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 text-left border outline-none focus:outline-none focus:ring-0 focus-visible:outline-none select-none ${
                  isActive
                    ? 'bg-[#82591A]/80 text-[#FCE7C8] border-[#C28C2C]/50 shadow-md shadow-[#82591A]/20'
                    : 'border-transparent text-[#94A3B8] hover:text-white hover:bg-[#161f30]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-[#FCE7C8]' : 'text-[#64748B]'
                  }`}
                />
                <span>{item.label}</span>
                {'badge' in item && item.badge > 0 && <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-[#D99B26] text-[#0d121c] text-[10px] font-bold flex items-center justify-center">{item.badge}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-[#192233]">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#161f30] transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#D99B26] text-[#0d121c] font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-xs text-[#64748B] truncate mt-0.5">
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
