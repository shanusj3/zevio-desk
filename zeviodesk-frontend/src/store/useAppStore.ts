import { create } from 'zustand';
import { Tenant, FilterOptions, NotificationItem, ActiveTab } from '../types';
import { authApi } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId?: string | null;
  avatarUrl?: string;
}

interface AppState {
  // Auth State
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;

  // View & Navigation State
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;

  // Modals & Drawers State
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;
  selectedTenantForDetails: Tenant | null;
  setSelectedTenantForDetails: (tenant: Tenant | null) => void;
  selectedTenantForEdit: Tenant | null;
  setSelectedTenantForEdit: (tenant: Tenant | null) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (isOpen: boolean) => void;

  // Filtering State
  filterOptions: FilterOptions;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  resetFilterOptions: () => void;

  // Notifications & Toast State
  notifications: NotificationItem[];
  setNotifications: (notifications: NotificationItem[]) => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'time' | 'read'>) => void;
  clearNotifications: () => void;

  toastMessage: { text: string; type: 'success' | 'info' | 'warning' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'warning') => void;
  clearToast: () => void;
}

const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('zevio_auth_status') : null;

export const useAppStore = create<AppState>((set) => ({
  // Auth - restore from localStorage flag
  isAuthenticated: storedAuth === 'true',
  currentUser: null,

  login: (user) => {
    localStorage.setItem('zevio_auth_status', 'true');
    set({ isAuthenticated: true, currentUser: user });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {}
    localStorage.removeItem('zevio_auth_status');
    set({ isAuthenticated: false, currentUser: null });
    // Force page reload so React re-reads localStorage state cleanly
    window.location.reload();
  },

  // View & Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  // Modals & Drawers
  isCreateModalOpen: false,
  setIsCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
  selectedTenantForDetails: null,
  setSelectedTenantForDetails: (tenant) => set({ selectedTenantForDetails: tenant }),
  selectedTenantForEdit: null,
  setSelectedTenantForEdit: (tenant) => set({ selectedTenantForEdit: tenant }),
  isImportModalOpen: false,
  setIsImportModalOpen: (isOpen) => set({ isImportModalOpen: isOpen }),

  // Filtering
  filterOptions: {
    search: '',
    status: 'All',
    alphabet: '',
  },
  setFilterOptions: (options) =>
    set((state) => ({
      filterOptions: { ...state.filterOptions, ...options },
    })),
  resetFilterOptions: () =>
    set({
      filterOptions: { search: '', status: 'All', alphabet: '' },
    }),

  // Notifications & Toasts
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `n_${Date.now()}`,
          time: 'Just now',
          read: false,
        },
        ...state.notifications,
      ],
    })),
  clearNotifications: () => set({ notifications: [] }),

  toastMessage: null,
  showToast: (text, type = 'success') => {
    set({ toastMessage: { text, type } });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3500);
  },
  clearToast: () => set({ toastMessage: null }),
}));
