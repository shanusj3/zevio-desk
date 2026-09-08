import React, { useState, useEffect, useRef } from 'react';
import {
  Search, MessageSquare, Send, Check, CheckCheck, AlertCircle, User,
  Lock, CheckSquare, ChevronDown, Flag, Star, Archive, MoreHorizontal,
  Plus, Smile, Paperclip, Sparkles, DollarSign, Settings, Mail, Phone,
  ExternalLink, ArrowLeft, UserX, Users, UserCheck, Inbox
} from 'lucide-react';
import { whatsappApi, WhatsAppConversation, WhatsAppMessage, tokenStore } from '../lib/api';
import { useAppStore } from '../store/useAppStore';

interface WhatsAppInboxProps {
  initialConversationId?: string;
}

type FilterType = 'ALL' | 'UNREAD' | 'STARRED' | 'UNASSIGNED' | 'ASSIGNED' | 'MY_ASSIGNED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SPAM' | 'ARCHIVE';

export const WhatsAppInbox: React.FC<WhatsAppInboxProps> = ({ initialConversationId }) => {
  const { currentUser, showToast } = useAppStore();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<'WhatsApp' | 'Email'>('WhatsApp');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch conversations on mount / filter change
  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const data = await whatsappApi.getConversations();
      setConversations(data);

      if (data.length > 0 && !selectedConversation) {
        const preselected = initialConversationId
          ? data.find(c => c.id === initialConversationId)
          : undefined;
        setSelectedConversation(preselected ?? data[0]);
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to load conversations', 'warning');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Auto focus search input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // 2. Fetch messages for active conversation
  const fetchMessages = async (conversationId: string, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setIsLoadingMessages(true);
        setMessages([]);
        setNextCursor(undefined);
      }
      const data = await whatsappApi.getMessages(conversationId, isLoadMore ? nextCursor : undefined);

      if (isLoadMore) {
        setMessages(prev => [...prev, ...data.messages]);
      } else {
        setMessages(data.messages);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      setNextCursor(data.nextCursor);
    } catch (e: any) {
      showToast(e.message || 'Failed to load message history', 'warning');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // 3. SSE Realtime message listening
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    const eventSource = new EventSource(`http://localhost:3001/api/whatsapp/events?token=${token}`, {
      withCredentials: true
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message && data.message.conversationId === selectedConversation?.id) {
          setMessages(prev => [data.message, ...prev]);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        fetchConversations();
      } catch (err) {}
    };

    return () => {
      eventSource.close();
    };
  }, [selectedConversation?.id]);

  // 4. Send Message Reply
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedConversation || isSending) return;

    const text = replyText.trim();
    setReplyText('');
    setIsSending(true);

    const clientMessageId = `msg_${Date.now()}`;

    try {
      const sentMsg = await whatsappApi.sendReply(selectedConversation.id, text, clientMessageId);
      setMessages(prev => [sentMsg, ...prev]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      fetchConversations();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch message', 'warning');
    } finally {
      setIsSending(false);
    }
  };

  // 5. Close & Assign handlers
  const handleCloseConversation = async () => {
    if (!selectedConversation) return;
    try {
      await whatsappApi.closeConversation(selectedConversation.id);
      showToast('Conversation marked as CLOSED', 'info');
      fetchConversations();
      setSelectedConversation(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to close thread', 'warning');
    }
  };

  const handleAssignConversation = async (userId: string | null) => {
    if (!selectedConversation) return;
    try {
      await whatsappApi.assignConversation(selectedConversation.id, userId);
      showToast('Assignee updated successfully', 'success');
      fetchConversations();
    } catch (e: any) {
      showToast(e.message || 'Failed to assign conversation', 'warning');
    }
  };

  const getContactName = (c: WhatsAppConversation) =>
    (c.contact.profileName || c.contact.phoneNumber || 'Unknown Customer').toUpperCase();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'S';

  const getFilterLabel = (f: FilterType) => {
    switch (f) {
      case 'ALL': return 'All conversations';
      case 'UNREAD': return 'Unread';
      case 'STARRED': return 'Starred';
      case 'UNASSIGNED': return 'Unassigned';
      case 'ASSIGNED': return 'Assigned';
      case 'MY_ASSIGNED': return 'Assigned to me';
      case 'HIGH': return 'High priority';
      case 'MEDIUM': return 'Medium priority';
      case 'LOW': return 'Low priority';
      case 'SPAM': return 'Spam';
      case 'ARCHIVE': return 'Archive';
      default: return 'All conversations';
    }
  };

  const filteredConversations = conversations.filter(c => {
    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      const phone = c.contact.phoneNumber.toLowerCase();
      const name = c.contact.profileName?.toLowerCase() || '';
      if (!phone.includes(term) && !name.includes(term)) return false;
    }

    // 2. Category Filter
    if (activeFilter === 'UNREAD') return c.unreadCount > 0;
    if (activeFilter === 'UNASSIGNED') return !c.assignedUserId;
    if (activeFilter === 'ASSIGNED') return !!c.assignedUserId;
    if (activeFilter === 'MY_ASSIGNED') return c.assignedUserId === currentUser?.id;
    if (activeFilter === 'SPAM') return false; // Placeholder for spam filter
    if (activeFilter === 'ARCHIVE') return c.status === 'CLOSED';

    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100/60 -m-6 md:-m-8">
      {/* ── TOP PAGE HEADER (Wix Style) ── */}
      <div className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xl shadow-slate-100 z-10">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-slate-800 tracking-tight">Inbox</span>
        </div>
      </div>

      {/* ── TWO-COLUMN / THREE-COLUMN MAIN BODY ── */}
      <div className="flex-1 flex overflow-hidden divide-x divide-slate-200">
        {/* 1. LEFT CONVERSATION LIST PANEL */}
        <div className="w-80 md:w-84 bg-white flex flex-col shrink-0 border-r border-slate-200">
          {/* ── Top Controls Bar (Normal Mode vs Search Mode) ── */}
          <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 relative">
            {isSearchOpen ? (
              /* SEARCH ACTIVE MODE (Wix Pill Search Bar) */
              <div className="flex items-center w-full gap-2 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
                  title="Close Search"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-blue-500 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search all conversations"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 bg-white border-2 border-blue-500 rounded-full pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none ring-2 ring-blue-100 shadow-sm"
                  />
                </div>
              </div>
            ) : (
              /* NORMAL MODE (Dropdown, Search Icon Button) */
              <>
                <div className="flex items-center gap-3">
                  {/* Dropdown Filter Trigger & Container */}
                  <div className="relative" ref={filterDropdownRef}>
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <span>{getFilterLabel(activeFilter)}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Wix Style Dropdown Menu (Only All conversations, Unread, Spam) */}
                    {showFilterDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1 text-xs font-medium text-slate-700 animate-in fade-in duration-100 overflow-hidden">
                        {/* 1. All conversations */}
                        <button
                          type="button"
                          onClick={() => { setActiveFilter('ALL'); setShowFilterDropdown(false); }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                            activeFilter === 'ALL'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <Inbox className="w-4 h-4 shrink-0" />
                          <span>All conversations</span>
                        </button>

                        {/* 2. Unread */}
                        <button
                          type="button"
                          onClick={() => { setActiveFilter('UNREAD'); setShowFilterDropdown(false); }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                            activeFilter === 'UNREAD'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <Mail className="w-4 h-4 shrink-0" />
                          <span>Unread</span>
                        </button>

                        {/* 3. Spam */}
                        <button
                          type="button"
                          onClick={() => { setActiveFilter('SPAM'); setShowFilterDropdown(false); }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                            activeFilter === 'SPAM'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
                          <span>Spam</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Search conversations"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>
              </>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingConversations ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-400">Loading messages...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700">No conversations found</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {searchQuery ? `No matches for "${searchQuery}"` : 'Incoming messages from WhatsApp or Email will show here.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = selectedConversation?.id === c.id;
                const name = getContactName(c);
                const dateString = c.lastMessageAt
                  ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'now';

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConversation(c)}
                    className={`w-full p-3.5 flex items-start gap-3 transition-colors text-left cursor-pointer border-l-4 ${
                      isActive
                        ? 'bg-[#edf4ff] border-l-blue-600'
                        : 'bg-white hover:bg-slate-50 border-l-transparent'
                    }`}
                  >
                    {/* Circle Grey Avatar with Initial */}
                    <div className="w-10 h-10 rounded-full bg-slate-400 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {getInitials(name)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate tracking-tight">
                          {name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                          {dateString}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {c.contact.phoneNumber}
                      </p>
                    </div>

                    {c.unreadCount > 0 && (
                      <span className="min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 2. CENTER & RIGHT MAIN CHAT AREA */}
        <div className="flex-1 bg-white flex flex-col min-w-0">
          {selectedConversation ? (
            <>
              {/* Active Conversation Top Header */}
              <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                {/* Left: Contact Avatar & Assignment */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-400 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {getInitials(getContactName(selectedConversation))}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                      {getContactName(selectedConversation)}
                    </h3>
                    <div className="relative flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
                      <select
                        value={selectedConversation.assignedUserId || ''}
                        onChange={(e) => handleAssignConversation(e.target.value || null)}
                        className="bg-transparent border-0 text-[11px] font-semibold text-slate-500 hover:text-slate-800 focus:ring-0 p-0 cursor-pointer outline-none"
                      >
                        <option value="">Assign to Your Team</option>
                        <option value={currentUser?.id}>{currentUser?.name} (You)</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Right: Action Icons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRightDrawer(!showRightDrawer)}
                    className={`p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer ${showRightDrawer ? 'bg-slate-100 text-blue-600' : ''}`}
                    title="Toggle Contact Info"
                  >
                    <User className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-slate-200 my-auto" />
                  <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="Flag">
                    <Flag className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="Star">
                    <Star className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="Archive">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="More options">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Scroll Container */}
              <div
                ref={chatContainerRef}
                className="flex-1 p-6 overflow-y-auto bg-[#fafafa] space-y-6 flex flex-col"
              >
                {/* Time Divider */}
                <div className="text-center my-2">
                  <span className="text-[11px] font-semibold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {selectedConversation.lastMessageAt
                      ? new Date(selectedConversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '10:42 PM'}
                  </span>
                </div>

                {isLoadingMessages ? (
                  <div className="py-10 text-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  /* Sample Wix Card message display if empty history */
                  <div className="max-w-xl mx-auto w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Zeviodesk sent a new message
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      Welcome to Zeviodesk Inbox. Connect WhatsApp or email to handle customer messages directly from this inbox.
                    </p>
                    <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold border-t border-slate-100">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>WhatsApp / Email</span>
                    </div>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isInbound = msg.direction === 'INBOUND';
                    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    if (isInbound) {
                      return (
                        <div key={msg.id} className="max-w-xl bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {getContactName(selectedConversation)} sent a new message
                            </span>
                            <span className="text-[10px] text-slate-400">{time}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{msg.body}</p>
                          <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold border-t border-slate-100">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            <span>WhatsApp</span>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={msg.id} className="flex flex-col items-end gap-1">
                          <div className="max-w-md bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-3 text-xs shadow-sm">
                            <p className="leading-relaxed">{msg.body}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mr-1">
                            <span>Sent</span>
                            <div className="w-4 h-4 rounded-full bg-slate-400 text-white font-bold text-[8px] flex items-center justify-center">
                              {getInitials(currentUser?.name || 'You')}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* AI Suggested Replies Banner */}
              <div className="px-6 py-2.5 bg-blue-50/70 border-t border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Start using AI suggested replies to automatically draft relevant responses.</span>
                </div>
                <button
                  onClick={() => showToast('AI suggestions enabled', 'success')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Get Started
                </button>
              </div>

              {/* Message Composer Card (Wix Card Style) */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-4 space-y-3">
                  {/* Composer Header Bar */}
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-400">Message via:</span>
                      <select
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value as any)}
                        className="font-bold text-blue-600 border-0 p-0 focus:ring-0 cursor-pointer bg-transparent outline-none"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-blue-600 -ml-1 pointer-events-none" />
                      <span className="text-slate-300 ml-2">|</span>
                      <span className="text-slate-500 font-medium ml-2">To:</span>
                      <span className="text-slate-700 font-semibold">{selectedConversation.contact.phoneNumber}</span>
                    </div>

                    <button className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />

                  {/* Composer Footer Action Toolbar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {/* Left Attachment & Formatting Tools */}
                    <div className="flex items-center gap-1.5">
                      <button className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" title="Quick Replies">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" title="Attach Invoice">
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" title="Emoji">
                        <Smile className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" title="Attach File">
                        <Paperclip className="w-4 h-4" />
                      </button>

                      {/* Write with AI Pill */}
                      <button
                        onClick={() => showToast('Generating AI draft...', 'info')}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 hover:border-slate-300 text-[11px] font-semibold text-slate-700 bg-white shadow-2xl shadow-slate-100 transition-colors cursor-pointer ml-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Write with AI</span>
                      </button>
                    </div>

                    {/* Right Send Button */}
                    <button
                      onClick={() => handleSendReply()}
                      disabled={!replyText.trim() || isSending}
                      className="px-5 py-2 bg-slate-300 hover:bg-blue-600 disabled:opacity-50 text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                    >
                      {selectedChannel === 'Email' ? 'Send Email' : 'Send Message'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-white">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No active thread selected</p>
              <p className="text-xs text-slate-400">Select a conversation thread from the left to start messaging.</p>
            </div>
          )}
        </div>

        {/* 3. RIGHT DETAILS DRAWER */}
        {showRightDrawer && selectedConversation && (
          <div className="w-72 bg-white flex flex-col divide-y divide-slate-200 overflow-y-auto shrink-0 border-l border-slate-200">
            {/* Section: Customer Profile Header */}
            <div className="p-5 flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-full bg-slate-400 text-white font-bold text-lg flex items-center justify-center">
                {getInitials(getContactName(selectedConversation))}
              </div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                {getContactName(selectedConversation)}
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                {selectedConversation.contact.phoneNumber}
              </p>
            </div>

            {/* Section: Contact Details */}
            <div className="p-5 space-y-4">
              <h5 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Contact Information</h5>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Phone</span>
                  <span className="font-mono text-slate-800">{selectedConversation.contact.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Channel</span>
                  <span className="font-semibold text-blue-600">WhatsApp Business</span>
                </div>
              </div>
            </div>

            {/* Section: Actions */}
            <div className="p-5 space-y-3">
              <button
                onClick={handleCloseConversation}
                className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Close Conversation</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
