import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, ChevronDown, LogOut, User, MessageSquare } from 'lucide-react';
import { NotificationItem } from '../types';
import { useAppStore } from '../store/useAppStore';
import { whatsappApi, WhatsAppConversation } from '../lib/api';
import { formatRelativeTime } from '../utils/formatters';

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
  onInboxConversationClick?: (conversationId: string) => void;
  onGoToInboxClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onCreateTenantClick,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  currentUser,
  toggleSidebarMobile,
  onProfileClick,
  onInboxConversationClick,
  onGoToInboxClick,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const inboxRef = useRef<HTMLDivElement>(null);
  const { logout, showToast } = useAppStore();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (inboxRef.current && !inboxRef.current.contains(event.target as Node)) {
        setIsInboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch conversations when inbox opens
  useEffect(() => {
    if (!isInboxOpen) return;
    setIsLoadingConversations(true);
    whatsappApi.getConversations('OPEN')
      .then(data => setConversations(data.slice(0, 8)))
      .catch(() => setConversations([]))
      .finally(() => setIsLoadingConversations(false));
  }, [isInboxOpen]);

  const handleSignOut = () => {
    setIsProfileOpen(false);
    logout();
    showToast('Signed out successfully.', 'info');
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const getContactLabel = (conv: WhatsAppConversation) =>
    conv.contact.profileName || conv.contact.phoneNumber || 'Unknown';

  const formatTime = (dateStr: string | null) => formatRelativeTime(dateStr);

  const handleConversationClick = (conv: WhatsAppConversation) => {
    setIsInboxOpen(false);
    if (onInboxConversationClick) onInboxConversationClick(conv.id);
  };

  const handleGoToInbox = () => {
    setIsInboxOpen(false);
    if (onGoToInboxClick) onGoToInboxClick();
  };

  return (
    <header className="h-14 border-b border-[#1e2535] bg-[#131720] px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Left: Menu toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebarMobile}
          className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1c2333] rounded-lg transition-colors outline-none focus:outline-none focus:ring-0 active:scale-95 cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center h-full gap-0">
        {/* Create Tenant Primary Button */}
        {onCreateTenantClick && (
          <button
            onClick={onCreateTenantClick}
            className="bg-[#116dff] hover:bg-[#3b82f6] text-white px-3 h-8 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer mr-3"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Tenant</span>
          </button>
        )}

        {/* ── Inbox Chat Icon (Same full-height hover effect as avatar) ── */}
        <div className="relative h-full flex items-center" ref={inboxRef}>
          <button
            id="header-inbox-btn"
            onClick={() => setIsInboxOpen(prev => !prev)}
            className={`relative flex items-center justify-center px-3 h-full transition-colors group cursor-pointer ${
              isInboxOpen ? 'bg-[#1c2333] text-white' : 'text-[#94A3B8] hover:text-white hover:bg-[#1c2333]'
            }`}
            aria-label="Open Inbox"
          >
            <MessageSquare className="w-[18px] h-[18px]" />
            {totalUnread > 0 && (
              <span className="absolute top-2 right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#116dff] text-white text-[9px] font-bold px-1 leading-none pointer-events-none">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>

          {isInboxOpen && (
            <div className="absolute right-0 top-full mt-1 w-96 md:w-[440px] h-[500px] max-h-[80vh] flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden text-slate-800">
              {/* Sticky Top Header */}
              <div className="sticky top-0 z-20 bg-white shrink-0">
                {/* Main Inbox Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
                  <span className="text-base font-bold text-slate-900">Inbox</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-xs text-[#116dff] hover:underline cursor-pointer font-semibold"
                      onClick={handleGoToInbox}
                    >
                      Mark all as read
                    </button>
                    <button
                      type="button"
                      className="text-xs text-[#116dff] hover:underline cursor-pointer font-semibold"
                      onClick={handleGoToInbox}
                    >
                      Go to Inbox
                    </button>
                  </div>
                </div>

                {/* Sub-tab Label */}
                <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/90 backdrop-blur-sm">
                  <span className="text-xs font-bold text-slate-700">All Messages</span>
                </div>
              </div>

              {/* Scrollable Conversations List Body */}
              <div className="flex-1 overflow-y-auto bg-white divide-y divide-slate-100">
                {isLoadingConversations ? (
                  <div className="flex flex-col gap-4 p-5">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-slate-100 rounded w-2/3" />
                          <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="h-full min-h-[340px] flex flex-col items-center justify-center py-16 px-6 gap-3 text-center bg-white">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-base font-bold text-slate-800">No open conversations</p>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                      New WhatsApp messages will appear here.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => handleConversationClick(conv)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                        {getContactLabel(conv).charAt(0).toUpperCase()}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {getContactLabel(conv)}
                          </span>
                          <span className="text-xs text-slate-400 ml-2 shrink-0">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {conv.contact.phoneNumber}
                        </p>
                      </div>
                      {/* Unread badge */}
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-[#116dff] text-white text-[10px] font-bold px-1.5 shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              {conversations.length > 0 && (
                <div className="border-t border-slate-100 p-3 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={handleGoToInbox}
                    className="w-full text-center text-xs font-semibold text-[#116dff] hover:underline cursor-pointer py-0.5"
                  >
                    View all conversations →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── User Profile ── */}
        <div className="relative h-full flex items-center" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-1.5 px-3 h-full transition-colors group cursor-pointer ${
              isProfileOpen ? 'bg-[#1c2333]' : 'hover:bg-[#1c2333]'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#78909C] text-white font-bold text-xs flex items-center justify-center">
              {currentUser.avatar}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] group-hover:text-white transition-colors" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-[#131720] border border-[#1e2535] rounded-lg shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-[#1e2535] mb-1">
                <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{currentUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  if (onProfileClick) onProfileClick();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#94A3B8] hover:text-white hover:bg-[#1c2333] rounded-md transition-colors cursor-pointer"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <div className="my-1 border-t border-[#1e2535]" />
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
