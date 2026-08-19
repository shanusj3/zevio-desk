import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { NotificationItem } from '../types';
import { useAppStore } from '../store/useAppStore';

interface HeaderProps {
  onCreateTenantClick?: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  currentUser: {
    name: string;
    email: string;
    avatar: string;
    role: string;
  };
  toggleSidebarMobile?: () => void;
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onCreateTenantClick,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  currentUser,
  toggleSidebarMobile,
  onProfileClick,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { logout, showToast } = useAppStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setIsProfileOpen(false);
    logout();
    showToast('Signed out successfully.', 'info');
  };

  return (
    <header className="h-16 border-b border-[#192233] bg-[#0c1017]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left Menu toggle button */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebarMobile}
          className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#161f30] rounded-lg transition-colors outline-none focus:outline-none focus:ring-0 active:scale-95 cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Create Tenant Primary Button */}
        {onCreateTenantClick && (
          <button
            onClick={onCreateTenantClick}
            className="bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] px-4 h-10 rounded-lg text-xs font-bold flex items-center gap-2 transition-all duration-150 shadow-md shadow-[#D99B26]/20 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Tenant</span>
          </button>
        )}



        {/* User Profile Trigger */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#161f30] transition-colors group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#D99B26] text-[#0d121c] font-bold text-xs flex items-center justify-center">
              {currentUser.avatar}
            </div>
            <span className="text-xs font-semibold text-white hidden sm:inline-block">
              {currentUser.role}
            </span>
            <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-white transition-colors" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#121824] border border-[#1e293b] rounded-lg shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-[#1e293b] mb-1">
                <p className="text-sm font-semibold text-white">
                  {currentUser.name}
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {currentUser.email}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  if (onProfileClick) onProfileClick();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#94A3B8] hover:text-white hover:bg-[#182030] rounded-md transition-colors cursor-pointer"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <div className="my-1 border-t border-[#1e293b]" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded-md transition-colors cursor-pointer font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
