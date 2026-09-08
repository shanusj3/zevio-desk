import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  Bell,
  Copy,
} from 'lucide-react';
import { ProfilePage } from './ProfilePage';
import { ItemCatalogSettings } from '../components/ItemCatalogSettings';
import { InvoiceTemplateSettings } from '../components/InvoiceTemplateSettings';
import { InventorySettings } from '../components/InventorySettings';
import { WhatsAppSettings } from '../components/WhatsAppSettings';
import { WhatsAppSetupModal } from '../components/WhatsAppSetupModal';
import { useAppStore } from '../store/useAppStore';

import gmailLogo from '../assets/gmail.png';
import facebookLogo from '../assets/facebook.png';
import whatsappLogo from '../assets/whatsapp.png';
import instagramLogo from '../assets/instagram.png';

interface SettingsViewProps {
  pathname?: string;
}

type TabType =
  | 'main'
  | 'general'
  | 'invoicing'
  | 'inventory'
  | 'whatsapp'
  | 'profile'
  | 'channels'
  | 'inbox'
  | 'notifications'
  | 'integrations';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  tabKey: TabType;
  path: string;
}

interface SettingCategory {
  id: string;
  title: string;
  items: SettingItem[];
}

const SETTING_CATEGORIES: SettingCategory[] = [
  {
    id: 'communications',
    title: 'Communications & notifications',
    items: [
      {
        id: 'communication-channels',
        title: 'Communication channels',
        description: 'Set up channels for communicating with customers and leads.',
        tabKey: 'channels',
        path: '/settings/channels',
      },
    ],
  },
];

export const SettingsView: React.FC<SettingsViewProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useAppStore();

  const [settingsSearch, setSettingsSearch] = useState('');
  const [settingsTab, setSettingsTab] = useState<TabType>('main');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  useEffect(() => {
    const p = location.pathname;
    if (p.includes('/settings/profile')) setSettingsTab('profile');
    else if (p.includes('/settings/whatsapp')) setSettingsTab('whatsapp');
    else if (p.includes('/settings/channels')) setSettingsTab('channels');
    else if (p.includes('/settings/invoicing')) setSettingsTab('invoicing');
    else if (p.includes('/settings/inventory')) setSettingsTab('inventory');
    else if (p.includes('/settings/catalog')) setSettingsTab('general');
    else if (p.includes('/settings/inbox')) setSettingsTab('inbox');
    else if (p.includes('/settings/notifications')) setSettingsTab('notifications');
    else if (p.includes('/settings/integrations')) setSettingsTab('integrations');
    else setSettingsTab('main');
  }, [location.pathname]);

  const handleNavigateTab = (tab: TabType, path: string) => {
    setSettingsTab(tab);
    navigate(path);
  };

  // Filter categories based on search input
  const query = settingsSearch.toLowerCase().trim();
  const filteredCategories = SETTING_CATEGORIES.map((cat) => {
    const matchingItems = cat.items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        cat.title.toLowerCase().includes(query)
    );
    return { ...cat, items: matchingItems };
  }).filter((cat) => cat.items.length > 0);

  // Sub-view Back Navigation Header
  const renderSubViewHeader = (_title?: string) => (
    <div className="mb-4 flex items-center">
      <button
        onClick={() => {
          setSettingsTab('main');
          navigate('/settings');
        }}
        className="w-9 h-9 rounded-full border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] hover:border-[#94a3b8] text-[#1e293b] flex items-center justify-center transition-all cursor-pointer"
        title="Back to Settings"
      >
        <ArrowLeft className="w-4.5 h-4.5 text-[#1e293b]" />
      </button>
    </div>
  );

  // Render Sub-Views
  if (settingsTab === 'profile') {
    return (
      <div className="space-y-4">
        {renderSubViewHeader('User Profile')}
        <ProfilePage />
      </div>
    );
  }

  if (settingsTab === 'whatsapp') {
    return (
      <div className="space-y-4">
        {renderSubViewHeader('WhatsApp API')}
        <WhatsAppSettings />
      </div>
    );
  }

  if (settingsTab === 'general') {
    return (
      <div className="space-y-4">
        {renderSubViewHeader('General Item Catalog')}
        <ItemCatalogSettings />
      </div>
    );
  }

  if (settingsTab === 'invoicing') {
    return (
      <div className="space-y-4">
        {renderSubViewHeader('Invoice Templates & Branding')}
        <InvoiceTemplateSettings />
      </div>
    );
  }

  if (settingsTab === 'inventory') {
    return (
      <div className="space-y-4">
        {renderSubViewHeader('Inventory & Stock Rules')}
        <InventorySettings />
      </div>
    );
  }

  if (settingsTab === 'channels') {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {renderSubViewHeader('Communication Channels')}
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Communication Channels</h1>
          <p className="text-xs text-[#64748B] mt-1">Set up channels for communicating with customers and leads.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden divide-y divide-[#f1f5f9]">
          {/* WhatsApp Business */}
          <div className="p-5 px-6 flex items-center justify-between hover:bg-[#f8fafc] transition-colors">
            <div className="flex items-center gap-4">
              <img src={whatsappLogo} alt="WhatsApp" className="w-10 h-10 object-contain" />
              <div>
                <h3 className="text-sm font-bold text-[#1e293b]">WhatsApp Business</h3>
                <p className="text-xs text-[#64748b] mt-0.5">View and reply to WhatsApp Business messages from your Inbox.</p>
              </div>
            </div>
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="px-5 py-1.5 bg-[#116dff] text-white font-semibold text-xs rounded-full hover:bg-[#0d5fd9] cursor-pointer transition-all shrink-0"
            >
              Set Up
            </button>
          </div>

          {/* Facebook */}
          <div className="p-5 px-6 flex items-center justify-between hover:bg-[#f8fafc] transition-colors">
            <div className="flex items-center gap-4">
              <img src={facebookLogo} alt="Facebook" className="w-10 h-10 object-contain" />
              <div>
                <h3 className="text-sm font-bold text-[#1e293b]">Facebook</h3>
                <p className="text-xs text-[#64748b] mt-0.5">View and reply to Facebook messages directly from your inbox.</p>
              </div>
            </div>
            <button
              onClick={() => showToast('Facebook Messenger integration coming soon.', 'info')}
              className="px-4 py-1.5 bg-[#f1f5f9] text-[#64748b] font-semibold text-xs rounded-full hover:bg-[#e2e8f0] cursor-pointer transition-all shrink-0"
            >
              Coming Soon
            </button>
          </div>

          {/* Instagram Business */}
          <div className="p-5 px-6 flex items-center justify-between hover:bg-[#f8fafc] transition-colors">
            <div className="flex items-center gap-4">
              <img src={instagramLogo} alt="Instagram" className="w-10 h-10 object-contain" />
              <div>
                <h3 className="text-sm font-bold text-[#1e293b]">Instagram Business</h3>
                <p className="text-xs text-[#64748b] mt-0.5">View and reply to Instagram Business messages from your Inbox.</p>
              </div>
            </div>
            <button
              onClick={() => showToast('Instagram Direct integration coming soon.', 'info')}
              className="px-4 py-1.5 bg-[#f1f5f9] text-[#64748b] font-semibold text-xs rounded-full hover:bg-[#e2e8f0] cursor-pointer transition-all shrink-0"
            >
              Coming Soon
            </button>
          </div>

          {/* Email Support (Gmail) */}
          <div className="p-5 px-6 flex items-center justify-between hover:bg-[#f8fafc] transition-colors">
            <div className="flex items-center gap-4">
              <img src={gmailLogo} alt="Gmail" className="w-10 h-10 object-contain" />
              <div>
                <h3 className="text-sm font-bold text-[#1e293b]">Email Support (Gmail)</h3>
                <p className="text-xs text-[#64748b] mt-0.5">View and reply to customer emails directly from your inbox.</p>
              </div>
            </div>
            <button
              onClick={() => showToast('Gmail integration coming soon.', 'info')}
              className="px-4 py-1.5 bg-[#f1f5f9] text-[#64748b] font-semibold text-xs rounded-full hover:bg-[#e2e8f0] cursor-pointer transition-all shrink-0"
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* WhatsApp Setup Modal */}
        <WhatsAppSetupModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          onGetStarted={() => {
            setIsWhatsAppModalOpen(false);
            handleNavigateTab('whatsapp', '/settings/whatsapp');
          }}
        />
      </div>
    );
  }

  if (settingsTab === 'inbox') {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {renderSubViewHeader('Inbox Settings')}
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Inbox Settings</h1>
          <p className="text-xs text-[#64748B] mt-1">Manage how you send and receive Inbox messages, agent assignment, and auto-replies.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9]">
            <div>
              <h3 className="text-sm font-bold text-[#1e293b]">Automatic Agent Assignment</h3>
              <p className="text-xs text-[#64748b] mt-0.5">Assign new incoming messages automatically to online advisors.</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              onChange={() => showToast('Inbox auto-assignment updated', 'success')}
              className="w-5 h-5 accent-[#116dff] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9]">
            <div>
              <h3 className="text-sm font-bold text-[#1e293b]">Sound Notifications</h3>
              <p className="text-xs text-[#64748b] mt-0.5">Play a chime when new customer messages arrive in the inbox.</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              onChange={() => showToast('Sound notification preference saved', 'success')}
              className="w-5 h-5 accent-[#116dff] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1e293b]">Customer Feedback Prompt</h3>
              <p className="text-xs text-[#64748b] mt-0.5">Automatically request a 5-star rating after completing a repair ticket.</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              onChange={() => showToast('Feedback prompt settings saved', 'success')}
              className="w-5 h-5 accent-[#116dff] cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  if (settingsTab === 'notifications') {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {renderSubViewHeader('Notifications')}
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Notifications Settings</h1>
          <p className="text-xs text-[#64748B] mt-1">Manage notifications you receive as an administrator and alerts sent to your customers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#116dff]" /> Notifications You Get
            </h2>
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between text-xs text-[#1e293b] font-medium cursor-pointer">
                <span>New Ticket Intake Alerts</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#116dff]" />
              </label>
              <label className="flex items-center justify-between text-xs text-[#1e293b] font-medium cursor-pointer">
                <span>Urgent Repair Status Change</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#116dff]" />
              </label>
              <label className="flex items-center justify-between text-xs text-[#1e293b] font-medium cursor-pointer">
                <span>Daily Revenue Digest Email</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#116dff]" />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#116dff]" /> Notifications You Send
            </h2>
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between text-xs text-[#1e293b] font-medium cursor-pointer">
                <span>WhatsApp Intake Confirmation</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#116dff]" />
              </label>
              <label className="flex items-center justify-between text-xs text-[#1e293b] font-medium cursor-pointer">
                <span>WhatsApp Ready for Pickup SMS/Alert</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#116dff]" />
              </label>
              <label className="flex items-center justify-between text-xs text-[#1e293b] font-medium cursor-pointer">
                <span>Invoice PDF Email Copy</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#116dff]" />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (settingsTab === 'integrations') {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {renderSubViewHeader('API & Integrations')}
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">API &amp; Webhooks</h1>
          <p className="text-xs text-[#64748B] mt-1">Configure developer API keys, webhooks, and third-party integrations.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#1e293b]">Secret API Key</h3>
            <p className="text-xs text-[#64748b] mt-0.5">Use this key to authenticate REST API requests from external software.</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="password"
                readOnly
                value="zv_live_9f8a37b120c4e92a18f"
                className="h-10 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-4 text-xs font-mono text-[#1e293b] w-72 focus:outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText('zv_live_9f8a37b120c4e92a18f');
                  showToast('API Key copied to clipboard!', 'success');
                }}
                className="h-10 px-4 bg-[#116dff] text-white font-semibold text-xs rounded-xl hover:bg-[#0d5fd9] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Key
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#f1f5f9]">
            <h3 className="text-sm font-bold text-[#1e293b]">Webhook Endpoint</h3>
            <p className="text-xs text-[#64748b] mt-0.5">Receive realtime HTTP POST payloads when ticket status changes.</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="text"
                defaultValue="https://api.yourdomain.com/webhooks/tickets"
                className="h-10 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-4 text-xs text-[#1e293b] w-full max-w-md focus:outline-none focus:border-[#116dff]"
              />
              <button
                onClick={() => showToast('Webhook configuration saved!', 'success')}
                className="h-10 px-4 bg-[#116dff] text-white font-semibold text-xs rounded-xl hover:bg-[#0d5fd9] transition-all shrink-0 cursor-pointer"
              >
                Save Endpoint
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Wix Studio Style Settings Directory ──────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Settings</h1>
      </div>

      {/* Search Bar (Wix Studio Style) */}
      <div className="relative">
        <Search className="w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
        <input
          type="text"
          placeholder="Search settings"
          value={settingsSearch}
          onChange={(e) => setSettingsSearch(e.target.value)}
          className="w-full h-11 bg-white border border-[#cbd5e1] rounded-full pl-11 pr-10 text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 transition-all"
        />
        {settingsSearch && (
          <button
            onClick={() => setSettingsSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#94a3b8] hover:text-[#1e293b]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grouped Category Sections */}
      {filteredCategories.length > 0 ? (
        <div className="space-y-8 pt-2">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="space-y-3">
              <h2 className="text-base font-bold text-[#1e293b] tracking-tight">{cat.title}</h2>
              <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden divide-y divide-[#f1f5f9]">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNavigateTab(item.tabKey, item.path)}
                    className="p-4 px-6 flex items-center justify-between hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-[#1e293b] group-hover:text-[#116dff] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#64748b] mt-0.5 font-normal">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4.5 h-4.5 text-[#94a3b8] group-hover:text-[#116dff] group-hover:translate-x-0.5 transition-all shrink-0 ml-4" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty Search State */
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center space-y-3 mt-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-[#64748b]">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1e293b]">No settings found</h3>
          <p className="text-xs text-[#64748b]">
            We couldn't find any settings matching "{settingsSearch}".
          </p>
          <button
            onClick={() => setSettingsSearch('')}
            className="px-4 py-2 bg-[#116dff] text-white text-xs font-semibold rounded-full hover:bg-[#0d5fd9] transition-all cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};

