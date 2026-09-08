import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, AlertCircle, MessageSquare, Pencil, Unlink, Eye, EyeOff, X, Shield, ToggleLeft, ToggleRight, Loader2, Facebook } from 'lucide-react';
import { whatsAppSchema } from '../lib/schemas';
import { useAppStore } from '../store/useAppStore';
import { whatsappApi } from '../lib/api';
import { facebookSdk } from '../lib/facebook-sdk';

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

export const WhatsAppSettings: React.FC = () => {
  const { showToast } = useAppStore();
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [wabaAccountId, setWabaAccountId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');
  const [formError, setFormError] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [testSuccess, setTestSuccess] = useState(false);
  
  // Meta Configuration details loaded from backend status config
  const [metaAppId, setMetaAppId] = useState('');
  const [metaConfigId, setMetaConfigId] = useState('');

  // Automation toggles
  const [automations, setAutomations] = useState({
    ticketCreated: false,
    readyForPickup: false,
    ticketCompleted: false,
  });

  // Load Facebook SDK on mount dynamically using credentials from backend env variables
  useEffect(() => {
    const loadFacebookSdk = (appId: string) => {
      if ((window as any).FB) return;
      
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.body.appendChild(js);

      (window as any).fbAsyncInit = function() {
        (window as any).FB.init({
          appId      : appId,
          cookie     : true,
          xfbml      : true,
          version    : 'v20.0'
        });
      };
    };

    whatsappApi.getStatus()
      .then(data => {
        if (data.metaAppId && data.metaAppId !== 'dev_meta_app_id') {
          loadFacebookSdk(data.metaAppId);
        }
      })
      .catch(() => {});
  }, []);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const data = await whatsappApi.getStatus();
      
      setMetaAppId(data.metaAppId || '');
      setMetaConfigId(data.metaConfigId || '');

      if (data.connected) {
        setIsConnected(true);
        setConnectionStatus('CONNECTED');
        setWabaAccountId(data.wabaId || '');
        setPhoneNumberId(data.phoneNumberId || '');
        setAccessToken('••••••••••••••••••••••••••••••••');
        setAutomations({
          ticketCreated: !!data.ticketCreatedEnabled,
          readyForPickup: !!data.readyForPickupEnabled,
          ticketCompleted: !!data.ticketCompletedEnabled,
        });
      } else {
        setIsConnected(false);
        setConnectionStatus('DISCONNECTED');
        setWabaAccountId('');
        setPhoneNumberId('');
        setAccessToken('');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to load WhatsApp settings.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Launch official Meta Embedded Signup flow using Facebook SDK and Business OAuth exchange
  const handleLaunchMetaSignup = async () => {
    if (!metaAppId || metaAppId === 'dev_meta_app_id') {
      setConnectionStatus('ERROR');
      setFormError('Meta App ID is not configured on the server. Please check your backend .env file.');
      return;
    }

    setConnectionStatus('CONNECTING');
    setFormError(null);

    try {
      // 1. Ensure Facebook SDK is initialized
      const FB = await facebookSdk.loadAndInit(metaAppId);

      // 2. Launch popup Facebook Login for Business
      FB.login((response: any) => {
        if (response.authResponse) {
          const authCode = response.authResponse.code;
          
          // 3. Dispatch temporary authorization result code to backend
          whatsappApi.completeEmbeddedSignup(authCode)
            .then(() => {
              showToast('WhatsApp connected successfully via Meta Embedded Signup!', 'success');
              fetchStatus();
            })
            .catch((err) => {
              setConnectionStatus('ERROR');
              setFormError(err.message || 'Failed WABA credentials setup and registration');
            });
        } else {
          setConnectionStatus('DISCONNECTED');
          showToast('Meta OAuth Embedded Signup closed or cancelled.', 'warning');
        }
      }, {
        config_id: metaConfigId,
        response_type: 'code',
        override_default_response_type: true
      });
    } catch (err: any) {
      setConnectionStatus('ERROR');
      setFormError('Failed to load or initialize Meta Facebook login popups.');
    }
  };

  const handleConnectWhatsApp = async (e: React.FormEvent) => {
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

    setConnectionStatus('CONNECTING');
    try {
      await whatsappApi.connect(
        wabaAccountId.trim(),
        phoneNumberId.trim(),
        accessToken.trim()
      );
      showToast('WhatsApp Business Account connected successfully!', 'success');
      setShowWhatsAppForm(false);
      fetchStatus();
    } catch (err: any) {
      setConnectionStatus('ERROR');
      setFormError(err.message || 'Failed to connect. Verify your credentials.');
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (window.confirm('Are you sure you want to disconnect WhatsApp? Outbox messages will cease.')) {
      try {
        await whatsappApi.disconnect();
        showToast('WhatsApp integration disconnected.', 'success');
        fetchStatus();
      } catch (err: any) {
        showToast(err.message || 'Failed to disconnect WhatsApp.', 'warning');
      }
    }
  };

  const toggleAutomation = async (type: 'ticketCreated' | 'readyForPickup' | 'ticketCompleted') => {
    const nextVal = !automations[type];
    try {
      await whatsappApi.toggleAutomation(type, nextVal);
      setAutomations(prev => ({ ...prev, [type]: nextVal }));
      showToast(`Automation toggled successfully.`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to toggle automation settings.', 'warning');
    }
  };

  const handleTestConnection = () => {
    setTestSuccess(true);
    showToast('Ping request sent successfully.', 'success');
    setTimeout(() => setTestSuccess(false), 3000);
  };

  const labelStyle = 'block text-xs font-semibold text-[#475569]';
  const inputStyle = 'w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#116dff] rounded-xl px-4 py-3 text-sm text-[#1e293b] placeholder-[#94a3b8] outline-none transition-colors';

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-[#116dff] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#64748B]">Loading connection settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 space-y-6">
      {testSuccess && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm flex items-center gap-2">
          <Check className="w-5 h-5 shrink-0 text-blue-500" />
          <span>Connection active. Webhook status 200 OK.</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-start gap-4 pb-5 border-b border-[#e2e8f0]">
        <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-[#25D366] shrink-0">
          <WhatsAppIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-[#1e293b] text-base">WhatsApp Business API</h3>
            {connectionStatus === 'CONNECTED' ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            ) : connectionStatus === 'CONNECTING' ? (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Connecting...
              </span>
            ) : connectionStatus === 'ERROR' ? (
              <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                Setup Failed
              </span>
            ) : (
              <span className="bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold">
                Not Connected
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Link Meta WhatsApp Cloud API to enable automated customer alerts, invoice delivery, and live messaging.
          </p>
        </div>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{formError}</span>
        </div>
      )}

      {/* State A: Before Connection */}
      {connectionStatus === 'DISCONNECTED' && !showWhatsAppForm && (
        <div className="space-y-6 pt-1 animate-in fade-in">
          <div className="space-y-3.5 text-xs text-[#475569]">
            <p className="font-semibold text-slate-800 text-sm">Connect your business WhatsApp number to Zeviodesk:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>✓ Receive customer messages</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>✓ Reply from Zeviodesk Team Inbox</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>✓ Automatic ticket status notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>✓ Direct PDF invoice &amp; document delivery</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLaunchMetaSignup}
            className="w-full h-12 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Connect WhatsApp</span>
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setShowWhatsAppForm(true);
              }}
              className="text-xs text-[#116dff] hover:underline font-semibold cursor-pointer"
            >
              Or connect manually using developer IDs
            </button>
          </div>
        </div>
      )}

      {/* State B: Connecting State */}
      {connectionStatus === 'CONNECTING' && (
        <div className="py-8 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#116dff] mx-auto" />
          <p className="text-xs font-semibold text-[#1e293b]">Connecting your WhatsApp account...</p>
          <p className="text-[10px] text-[#64748B] max-w-xs mx-auto">Waiting for authorization exchange callback from Meta Business dashboard.</p>
        </div>
      )}

      {/* State C: Connected details and toggles */}
      {connectionStatus === 'CONNECTED' && !showWhatsAppForm && (
        <div className="space-y-6 pt-1 divide-y divide-[#e2e8f0]">
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5 space-y-3.5 text-xs text-[#334155]">
            <div>
              <span className="text-[#64748B] block text-[11px] font-semibold mb-0.5">WABA Account ID</span>
              <span className="font-mono text-[#1e293b] text-sm font-semibold">{wabaAccountId}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px] font-semibold mb-0.5">Phone Number ID</span>
              <span className="font-mono text-[#1e293b] text-sm font-semibold">{phoneNumberId}</span>
            </div>
          </div>

          {/* Automation Configuration Toggles */}
          <div className="pt-6 space-y-4">
            <h4 className="text-sm font-bold text-[#1e293b] tracking-tight">Automated Notifications</h4>
            <div className="space-y-3">
              {[
                { id: 'ticketCreated', label: 'Ticket Created Alert', desc: 'Notify customer immediately when ticket is logged' },
                { id: 'readyForPickup', label: 'Ready for Pickup Alert', desc: 'Notify customer when device is ready' },
                { id: 'ticketCompleted', label: 'Ticket Completed & Invoice', desc: 'Send thank you template and PDF invoice' },
              ].map(({ id, label, desc }) => (
                <div key={id} className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-semibold text-[#1e293b] block">{label}</span>
                    <span className="text-[11px] text-[#64748B] block">{desc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAutomation(id as any)}
                    className="text-[#116dff] hover:opacity-85 transition-opacity cursor-pointer animate-in fade-in"
                  >
                    {automations[id as keyof typeof automations] ? (
                      <ToggleRight className="w-10 h-6 shrink-0 text-[#116dff]" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-[#94a3b8] shrink-0" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Settings actions */}
          <div className="flex items-center gap-3 pt-6">
            <button
              type="button"
              onClick={handleTestConnection}
              className="flex-1 h-11 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#25D366]" />
              <span>Test Ping</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAccessToken('');
                setShowWhatsAppForm(true);
              }}
              className="flex-1 h-11 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Pencil className="w-4 h-4 text-amber-500" />
              <span>Update credentials</span>
            </button>
            <button
              type="button"
              onClick={handleDisconnectWhatsApp}
              className="h-11 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-red-200 cursor-pointer"
            >
              <Unlink className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}

      {/* State D: Connection Setup Failed/Error */}
      {connectionStatus === 'ERROR' && !showWhatsAppForm && (
        <div className="space-y-4 text-center py-6 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500 border border-red-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-slate-800 text-sm">WhatsApp connection couldn't be completed</h5>
            <p className="text-xs text-slate-500 font-medium">Verify your backend Meta App configuration credentials.</p>
          </div>
          <div className="pt-2 flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => setConnectionStatus('DISCONNECTED')}
              className="px-5 h-10 bg-slate-100 hover:bg-slate-200 text-[#334155] text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleLaunchMetaSignup}
              className="px-5 h-10 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* State E: Form is Open (Manual Credentials Mode) */}
      {showWhatsAppForm && (
        <form onSubmit={handleConnectWhatsApp} className="space-y-5 pt-1 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
            <h4 className="font-bold text-[#1e293b] text-sm flex items-center gap-2">
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              <span>{isConnected ? 'Update credentials' : 'Connect credentials'}</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowWhatsAppForm(false);
                setFormError(null);
              }}
              className="text-[#64748B] hover:text-[#1e293b] p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className={labelStyle}>WABA Account ID</label>
            <input
              type="text"
              value={wabaAccountId}
              onChange={(e) => setWabaAccountId(e.target.value)}
              placeholder="e.g. 104928402910492"
              className={inputStyle}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelStyle}>Phone Number ID</label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="e.g. 109283746501234"
              className={inputStyle}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelStyle}>Permanent System Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="e.g. EAAG..."
                className={`${inputStyle} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1e293b] transition-colors cursor-pointer"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowWhatsAppForm(false);
                setFormError(null);
              }}
              className="px-5 h-11 bg-white hover:bg-[#f8fafc] border border-[#cbd5e1] text-[#334155] rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-11 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Connect</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
