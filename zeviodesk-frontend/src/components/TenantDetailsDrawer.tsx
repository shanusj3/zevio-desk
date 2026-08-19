import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  ExternalLink,
  Pencil,
  Store,
  Shield,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Key,
  Phone,
  Eye,
  EyeOff,
  Link,
  Unlink,
  Check,
  Loader2,
  UserCircle2,
} from 'lucide-react';
import { Tenant } from '../types';
import { whatsAppSchema } from '../lib/schemas';
import { usersApi, TenantUser } from '../lib/api';

interface TenantDetailsDrawerProps {
  tenant: Tenant | null;
  onClose: () => void;
  onEdit: (tenant: Tenant) => void;
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const TenantDetailsDrawer: React.FC<TenantDetailsDrawerProps> = ({
  tenant,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'subscription' | 'users' | 'whatsapp'
  >('overview');

  // Fetch real users for this tenant when the users tab is active
  const {
    data: tenantUsers,
    isLoading: usersLoading,
  } = useQuery<TenantUser[]>({
    queryKey: ['tenant-users', tenant?.id],
    queryFn: () => usersApi.fetchByTenant(tenant!.id),
    enabled: !!tenant?.id && activeTab === 'users',
    staleTime: 1000 * 60,
  });

  // WhatsApp form & connection state
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [wabaAccountId, setWabaAccountId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // Reset or load tenant-specific state when drawer opens with a tenant
  useEffect(() => {
    if (tenant) {
      setShowWhatsAppForm(false);
      setFormError(null);
      setSuccessNotice(null);
      setTestSuccess(false);
      // Mock existing connection for active tenants if desired or keep clean
      if (tenant.id === '1') {
        setWabaAccountId('109283749019284');
        setPhoneNumberId('103948201928374');
        setAccessToken('EAAG8921x1908234y890123u489102');
        setIsConnected(true);
      } else {
        setWabaAccountId('');
        setPhoneNumberId('');
        setAccessToken('');
        setIsConnected(false);
      }
    }
  }, [tenant?.id]);

  const handleConnectWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationResult = whatsAppSchema.safeParse({
      wabaAccountId: wabaAccountId.trim(),
      phoneNumberId: phoneNumberId.trim(),
      accessToken: accessToken.trim(),
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      setFormError(firstIssue ? firstIssue.message : 'Please check all required Meta API fields.');
      return;
    }

    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setShowWhatsAppForm(false);
      setSuccessNotice('WhatsApp Business Account connected successfully!');
      setTimeout(() => setSuccessNotice(null), 4000);
    }, 600);
  };

  const handleDisconnectWhatsApp = () => {
    if (window.confirm('Are you sure you want to disconnect WhatsApp Business API?')) {
      setIsConnected(false);
      setWabaAccountId('');
      setPhoneNumberId('');
      setAccessToken('');
      setShowWhatsAppForm(false);
      setSuccessNotice('WhatsApp integration disconnected.');
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  const handleTestConnection = () => {
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(false), 3000);
  };

  return (
    <AnimatePresence>
      {tenant && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-xl bg-[#0e131d] border-l border-[#1d273a] shadow-2xl flex flex-col h-full z-10"
          >
            {/* Drawer Header */}
        <div className="p-6 border-b border-[#1d273a] flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Tenant Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-[#64748B] hover:text-white hover:bg-[#192233] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Tenant Identity Banner */}
        <div className="p-6 border-b border-[#1d273a] bg-[#121824]/50 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/10"
                style={{ backgroundColor: tenant.primaryColor || '#7C3AED' }}
              >
                {tenant.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Store className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-white">{tenant.name}</h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      tenant.status === 'Active'
                        ? 'bg-[#064E3B]/80 text-[#34D399] border border-[#059669]/40'
                        : 'bg-[#7F1D1D]/80 text-[#F87171] border border-[#DC2626]/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        tenant.status === 'Active' ? 'bg-[#34D399]' : 'bg-[#F87171]'
                      }`}
                    />
                    {tenant.status}
                  </span>
                </div>
                <a
                  href={`https://${tenant.subdomain}.zeviodesk.com`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#94A3B8] hover:text-[#D99B26] flex items-center gap-1 mt-1 transition-colors group"
                >
                  <span>https://{tenant.subdomain}.zeviodesk.com</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            <button
              onClick={() => onEdit(tenant)}
              className="px-3.5 h-10 bg-[#182030] hover:bg-[#202b40] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-[#2b3952] transition-colors shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>

          {/* Drawer Navigation Tabs */}
          <div className="flex items-center gap-6 mt-6 border-b border-[#1d273a]/80 -mb-6 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'subscription', label: 'Subscription' },
              { id: 'users', label: 'Users' },
              { id: 'whatsapp', label: 'WhatsApp' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#D99B26] text-[#D99B26]'
                    : 'border-transparent text-[#64748B] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#D99B26]">
                  Basic Information
                </h4>
                <div className="bg-[#121824] border border-[#1d273a] rounded-lg p-4 grid grid-cols-2 gap-4 text-xs">
                  <div className="col-span-2">
                    <span className="text-[#64748B] block mb-1">
                      Tenant / Shop Name
                    </span>
                    <p className="font-semibold text-white text-sm">
                      {tenant.name}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#64748B] block mb-1">
                      Description
                    </span>
                    <p className="text-[#CBD5E1]">
                      {tenant.description || 'No description provided.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-1">Subdomain</span>
                    <p className="font-mono text-white">{tenant.subdomain}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-1">
                      Business Email
                    </span>
                    <p className="text-white">{tenant.businessEmail}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-1">
                      Phone Number
                    </span>
                    <p className="text-white">{tenant.phone}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-1">
                      GST Number
                    </span>
                    <p className="text-white">{tenant.gstNumber || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#64748B] block mb-1">Address</span>
                    <p className="text-white">{tenant.address}</p>
                  </div>
                </div>
              </div>

              {/* Branding Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#D99B26]">Branding</h4>
                <div className="bg-[#121824] border border-[#1d273a] rounded-lg p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: tenant.primaryColor }}
                    >
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[11px]">
                        Primary Color
                      </span>
                      <span className="font-mono text-white font-semibold">
                        {tenant.primaryColor}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{
                        backgroundColor: tenant.secondaryColor || '#F59E0B',
                      }}
                    >
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[11px]">
                        Secondary Color
                      </span>
                      <span className="font-mono text-white font-semibold">
                        {tenant.secondaryColor || '#F59E0B'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop Admin Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#D99B26]">
                  Shop Admin Information
                </h4>
                <div className="bg-[#121824] border border-[#1d273a] rounded-lg p-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#64748B] block mb-1">Admin Name</span>
                    <p className="font-semibold text-white">{tenant.adminName}</p>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-1">Admin Email</span>
                    <p className="text-white">{tenant.adminEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#64748B] block mb-1">Admin Phone</span>
                    <p className="text-white">{tenant.adminPhone}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps Section */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#121824] border border-[#1d273a] rounded-xl p-3">
                  <span className="text-[#64748B] block mb-0.5">Created At</span>
                  <p className="font-semibold text-white">{tenant.createdAt}</p>
                </div>
                <div className="bg-[#121824] border border-[#1d273a] rounded-xl p-3">
                  <span className="text-[#64748B] block mb-0.5">Updated At</span>
                  <p className="font-semibold text-white">{tenant.updatedAt}</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <div className="bg-[#121824] border border-[#1d273a] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#64748B]">Current Plan</span>
                    <h3 className="text-lg font-bold text-white">
                      {tenant.plan || 'Enterprise'} Plan
                    </h3>
                  </div>
                  <span className="bg-[#D99B26]/20 text-[#D99B26] border border-[#D99B26]/30 px-3 py-1 rounded-full text-xs font-semibold">
                    {tenant.monthlyRevenue || '$2,850'} / mo
                  </span>
                </div>
                <div className="text-xs text-[#94A3B8] space-y-2 border-t border-[#1d273a] pt-3">
                  <div className="flex items-center justify-between">
                    <span>Billing Frequency</span>
                    <span className="text-white font-medium">Monthly</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Renewal Date</span>
                    <span className="text-white font-medium">19/07/2026</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Max Allowed Staff</span>
                    <span className="text-white font-medium">100 Users</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#94A3B8]">
                  {usersLoading
                    ? 'Loading...'
                    : `Total Users: ${tenantUsers?.length ?? tenant.usersCount}`}
                </span>
              </div>

              {usersLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#64748B] gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D99B26]" />
                  <span className="text-xs">Loading users...</span>
                </div>
              ) : tenantUsers && tenantUsers.length > 0 ? (
                tenantUsers.map((usr) => (
                  <div
                    key={usr.id}
                    className="bg-[#121824] border border-[#1d273a] rounded-xl p-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1d273a] flex items-center justify-center text-[#94A3B8] shrink-0">
                        <UserCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{usr.name}</p>
                        <p className="text-[11px] text-[#64748B]">
                          {usr.role} • {usr.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        usr.status === 'ACTIVE'
                          ? 'text-[#34D399] bg-[#064E3B]/60'
                          : 'text-[#F87171] bg-[#7F1D1D]/60'
                      }`}
                    >
                      {usr.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-[#64748B] gap-2">
                  <Users className="w-8 h-8 opacity-30" />
                  <span className="text-xs">No users found for this tenant.</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-5">
              {/* Notifications / Alerts */}
              {successNotice && (
                <div className="bg-[#064E3B]/80 border border-[#059669] text-[#34D399] p-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successNotice}</span>
                </div>
              )}

              {testSuccess && (
                <div className="bg-[#1E1B4B]/80 border border-[#4338CA] text-[#A5B4FC] p-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <Check className="w-4 h-4 shrink-0 text-[#818CF8]" />
                  <span>Test message ping sent successfully! WhatsApp Webhook status: 200 OK.</span>
                </div>
              )}

              {/* Main Card */}
              <div className="bg-[#121824] border border-[#1d273a] rounded-lg p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                    <WhatsAppIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-white text-sm">WhatsApp Business API</h4>
                      {isConnected ? (
                        <span className="bg-[#064E3B]/80 text-[#34D399] border border-[#059669]/40 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                          Connected
                        </span>
                      ) : (
                        <span className="bg-[#1E293B] text-[#94A3B8] border border-[#334155] px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                          Not Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Link Meta WhatsApp Cloud API to enable automated customer alerts, invoice delivery, and live messaging for {tenant.name}.
                    </p>
                  </div>
                </div>

                {/* State A: Not Connected & Form Closed -> Show "Connect with WhatsApp" Button */}
                {!isConnected && !showWhatsAppForm && (
                  <div className="pt-3 border-t border-[#1d273a] space-y-4">
                    <div className="bg-[#0e131d] rounded-lg p-3.5 border border-[#1d273a] text-xs text-[#CBD5E1] space-y-2">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <Shield className="w-4 h-4 text-[#D99B26]" />
                        <span>Integration Requirements</span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8]">
                        You will need your Meta Business Account credentials to authenticate API calls and send WhatsApp communications.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowWhatsAppForm(true)}
                      className="w-full h-11 bg-[#25D366] hover:bg-[#20bd5a] text-[#0b141a] font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[#25D366]/20 active:scale-[0.99] cursor-pointer"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      <span>Connect with WhatsApp</span>
                    </button>
                  </div>
                )}

                {/* State B: Connected State Details & Actions */}
                {isConnected && !showWhatsAppForm && (
                  <div className="pt-3 border-t border-[#1d273a] space-y-4">
                    <div className="bg-[#0e131d] border border-[#1d273a] rounded-lg p-3.5 space-y-2.5 text-xs">
                      <div>
                        <span className="text-[#64748B] block text-[11px] font-medium">WhatsApp Business Account ID</span>
                        <span className="font-mono text-white font-semibold">{wabaAccountId}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[11px] font-medium">Phone Number ID</span>
                        <span className="font-mono text-white font-semibold">{phoneNumberId}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[11px] font-medium">Permanent Access Token</span>
                        <span className="font-mono text-[#34D399] font-semibold tracking-wider">
                          {accessToken ? `${accessToken.slice(0, 6)}••••••••••••${accessToken.slice(-4)}` : '••••••••••••'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleTestConnection}
                        className="flex-1 h-9 bg-[#1d273a] hover:bg-[#283650] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#2d3d5a]"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>Test Ping</span>
                      </button>
                      <button
                        onClick={() => setShowWhatsAppForm(true)}
                        className="flex-1 h-9 bg-[#1d273a] hover:bg-[#283650] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#2d3d5a]"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#D99B26]" />
                        <span>Edit Credentials</span>
                      </button>
                      <button
                        onClick={handleDisconnectWhatsApp}
                        className="h-9 px-3 bg-[#3f1616] hover:bg-[#521c1c] text-[#F87171] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#6b2525]"
                        title="Disconnect WhatsApp"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* State C: Form is Open (Connect / Edit Mode) */}
              {showWhatsAppForm && (
                <form
                  onSubmit={handleConnectWhatsApp}
                  className="bg-[#121824] border border-[#1d273a] rounded-lg p-5 space-y-4 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between border-b border-[#1d273a] pb-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                      <span>{isConnected ? 'Update WhatsApp API Credentials' : 'Connect WhatsApp Account'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowWhatsAppForm(false)}
                      className="text-[#64748B] hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {formError && (
                    <div className="bg-[#7F1D1D]/70 border border-[#DC2626]/50 text-[#F87171] p-3 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* 1. WhatsApp Business Account ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CBD5E1] block">
                      WhatsApp Business Account ID <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={wabaAccountId}
                      onChange={(e) => setWabaAccountId(e.target.value)}
                      placeholder="e.g. 104928402910492"
                      className="w-full bg-[#0b0f17] border border-[#23314a] focus:border-[#25D366] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] outline-none font-mono transition-colors"
                    />
                    <p className="text-[11px] text-[#64748B]">
                      Enter your Meta Business Suite WABA Account ID
                    </p>
                  </div>

                  {/* 2. Phone Number ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CBD5E1] block">
                      Phone Number ID <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="e.g. 109283746501234"
                      className="w-full bg-[#0b0f17] border border-[#23314a] focus:border-[#25D366] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] outline-none font-mono transition-colors"
                    />
                    <p className="text-[11px] text-[#64748B]">
                      Unique Phone Number ID assigned in WhatsApp API setup
                    </p>
                  </div>

                  {/* 3. Permanent Access Token */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#CBD5E1] block">
                      Permanent Access Token <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="e.g. EAAG..."
                        className="w-full bg-[#0b0f17] border border-[#23314a] focus:border-[#25D366] rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-[#64748B] outline-none font-mono transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      System User permanent token with whatsapp_business_messaging permission
                    </p>
                  </div>

                  {/* Submit / Cancel row */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWhatsAppForm(false)}
                      className="px-4 h-10 bg-[#182030] hover:bg-[#202b40] text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isConnecting}
                      className="px-5 h-10 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 text-[#0b141a] font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-md shadow-[#25D366]/20 active:scale-[0.98] cursor-pointer"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Action Button */}
        <div className="p-4 border-t border-[#1d273a] bg-[#0c1017] shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold py-3 rounded-lg text-sm transition-all shadow-lg shadow-[#D99B26]/10 active:scale-[0.99]"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
  );
};
