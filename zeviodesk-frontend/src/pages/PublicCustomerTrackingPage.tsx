import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, RefreshCw, Wrench, ShieldCheck, MapPin, CheckCircle2, Home } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatDateTime } from '../utils/formatters';

interface PublicTicketDTO {
  ticketNumber: string;
  trackingToken: string;
  trackingEnabled: boolean;
  currentStatus: string;
  statusLabel: string;
  lifecycleStage: 'RECEIVED' | 'INSPECTION' | 'IN_REPAIR' | 'QUALITY_CHECK' | 'READY' | 'CANCELLED';
  updatedAt: string;
  createdAt: string;

  device: {
    brand: string | null;
    model: string | null;
    itemCategory: string | null;
    title: string;
    serialNumber: string | null;
    itemCondition: string | null;
    accessories: string | null;
  };

  reportedIssue: string | null;

  shop: {
    name: string;
    logo: string | null;
    phone: string | null;
    address: string | null;
    whatsapp: string | null;
    primaryColor: string;
  };

  statusHistory: Array<{
    id: string;
    status: string;
    statusLabel: string;
    customerNote: string | null;
    createdAt: string;
  }>;

  intakePhotos: string[];

  financials: {
    showEstimate: boolean;
    showParts: boolean;
    showAdvance: boolean;
    showBalance: boolean;
    estimatedCost: number | null;
    advancePaid: number | null;
    balanceDue: number | null;
    partsRequired: Array<{ name: string; quantity?: number }>;
  };
}

export const PublicCustomerTrackingPage: React.FC = () => {
  const [ticket, setTicket] = useState<PublicTicketDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [logoError, setLogoError] = useState(false);

  // Extract token from URL /track/:token or query params
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const trackIdx = pathSegments.indexOf('track');
  let token = '';
  if (trackIdx !== -1 && trackIdx + 1 < pathSegments.length) {
    token = pathSegments[trackIdx + 1];
  }
  if (!token) {
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('token') || urlParams.get('t') || '';
  }

  const fetchTrackingData = async () => {
    if (!token) {
      setError('Tracking link unavailable or invalid token');
      setLoading(false);
      return;
    }

    const backendOrigin = window.location.hostname.includes('localhost') ? 'http://localhost:3001' : '';
    try {
      let res = await fetch(`${backendOrigin}/api/v1/public/tickets/${token}`);
      if (!res.ok) {
        res = await fetch(`${backendOrigin}/api/public/tickets/${token}`);
      }
      if (!res.ok) {
        res = await fetch(`/api/v1/public/tickets/${token}`);
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Tracking information unavailable');
      }
      setTicket(data.data);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load repair tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Format date helper
  const formatDateOnly = (dateStr?: string | null) => formatDate(dateStr, { formatStyle: 'numeric-slash' });

  const formatEventTime = (dateStr: string) => formatDateTime(dateStr, { style: 'compact' });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#3b99ed] border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Loading repair status...</h3>
          <p className="text-xs text-slate-500">Fetching live updates from service center</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg border border-slate-100 text-center space-y-4">
          <img
            src="/assets/error-illustration.png"
            alt="Tracking Unavailable"
            className="w-48 h-auto mx-auto object-contain"
          />
          <h3 className="text-lg font-bold text-slate-800">Tracking Link Unavailable</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            This tracking link may be invalid, expired, or disabled by the repair center. Please contact the shop directly for assistance.
          </p>
          <button
            type="button"
            onClick={fetchTrackingData}
            className="w-full h-11 bg-[#3b99ed] hover:bg-[#2b88dc] text-white font-bold rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // 6 Stepper Stages fitting cleanly on a single horizontal line
  const timelineStages = [
    { key: 'RECEIVED', label: 'Received', desc: 'Device received at service center.' },
    { key: 'DIAGNOSING', label: 'Diagnosing', desc: 'Diagnosing & inspecting product.' },
    { key: 'WAITING_FOR_PARTS', label: 'Waiting for Parts', desc: 'Awaiting replacement components.' },
    { key: 'IN_PROGRESS', label: 'In Progress', desc: 'Active repair work in progress.' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Ready for customer pickup.' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Job completed & delivered.' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 0;
      case 'DIAGNOSING':
      case 'AWAITING_APPROVAL': return 1;
      case 'WAITING_FOR_PARTS': return 2;
      case 'IN_PROGRESS':
      case 'REPAIR_COMPLETED':
      case 'QUALITY_CHECK':
      case 'REWORK': return 3;
      case 'READY_FOR_PICKUP': return 4;
      case 'COMPLETED':
      case 'DELIVERED':
      case 'CLOSED': return 5;
      case 'CANCELLED': return 0;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(ticket.currentStatus);

  // Status message copy
  const getStatusText = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'Your product has been successfully delivered to our service center and is queued for initial inspection.';
      case 'DIAGNOSING':
      case 'AWAITING_APPROVAL':
        return 'Your product has been successfully delivered to our service center and is currently undergoing diagnosis. Our team is diligently working to identify the issue and determine the necessary repairs or service required.';
      case 'IN_PROGRESS':
      case 'REPAIR_COMPLETED':
      case 'QUALITY_CHECK':
      case 'REWORK':
        return 'Our certified technicians are currently carrying out repairs on your device. We are ensuring all service procedures meet high quality standards.';
      case 'WAITING_FOR_PARTS':
        return 'Your device is in our repair pipeline. We are currently awaiting arrival of genuine replacement components to complete the repair.';
      case 'READY_FOR_PICKUP':
        return 'Great news! Your repair is finished, testing has passed, and your product is ready for pickup / delivery.';
      case 'COMPLETED':
      case 'DELIVERED':
      case 'CLOSED':
        return 'Your repair job has been completed and delivered. Thank you for choosing our service center!';
      case 'CANCELLED':
        return 'This repair ticket has been cancelled. Please contact the service center for further details.';
      default:
        return 'Our team is actively working on your product.';
    }
  };

  // Find date for each stage from history
  const getStageDate = (stageIndex: number) => {
    if (stageIndex === 0) return formatDateOnly(ticket.createdAt);
    if (stageIndex <= currentStepIdx) {
      const match = ticket.statusHistory.find((h) => getStepIndex(h.status) === stageIndex);
      return match ? formatDateOnly(match.createdAt) : '-';
    }
    return '-';
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased selection:bg-[#3b99ed] selection:text-white pb-16">
      {/* SHOP NAVBAR */}
      <header className="bg-white border-b border-slate-100 py-3.5 px-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {ticket.shop.logo && !logoError ? (
              <img
                src={ticket.shop.logo}
                alt={ticket.shop.name}
                onError={() => setLogoError(true)}
                className="h-10 max-w-[200px] object-contain rounded-lg"
              />
            ) : (
              <div className="h-10 px-4 bg-[#3b99ed] text-white font-extrabold flex items-center justify-center text-sm rounded-xl shadow-xs">
                {ticket.shop.name}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {ticket.shop.whatsapp && (
              <a
                href={`https://wa.me/${ticket.shop.whatsapp.replace(/\D/g, '')}?text=Hi!%20Checking%20status%20for%20ticket%20%23${ticket.ticketNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xs transition-colors"
                title="WhatsApp Shop"
              >
                <MessageCircle className="w-4 h-4 fill-white stroke-none" />
              </a>
            )}
            {ticket.shop.phone && (
              <a
                href={`tel:${ticket.shop.phone}`}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                title="Call Shop"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-10 pb-6 space-y-12">
        {/* HERO SECTION - REPAIR STATUS */}
        <section className="text-center max-w-2xl mx-auto space-y-5">
          {/* Top Center Wrench Icon */}
          <div className="w-24 h-24 rounded-full bg-[#f0f4f9] border-4 border-white shadow-xs flex items-center justify-center mx-auto transition-transform hover:scale-105">
            <Wrench className="w-10 h-10 text-slate-700 stroke-[1.5]" />
          </div>

          {/* Repair Status Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Repair Status #{ticket.ticketNumber}
          </h2>

          {/* Contextual Description Message */}
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal px-2">
            {getStatusText(ticket.currentStatus)}
          </p>

          {/* NOTE: Estimated delivery time intentionally excluded as requested */}

          {/* Current Status Pill */}
          <div className="pt-1 flex justify-center">
            <StatusBadge status={ticket.currentStatus} label={ticket.statusLabel} size="lg" />
          </div>
        </section>

        {/* HORIZONTAL TIMELINE STEPPER */}
        <section className="pt-4 pb-6 overflow-x-auto scrollbar-none">
          <div className="min-w-[680px] max-w-3xl mx-auto px-4">
            {/* Stage Dates Row */}
            <div className="grid grid-cols-6 text-center text-[11px] font-medium text-slate-400 mb-3">
              {timelineStages.map((_, idx) => (
                <span key={idx} className={idx <= currentStepIdx ? 'text-slate-600 font-semibold' : ''}>
                  {getStageDate(idx)}
                </span>
              ))}
            </div>

            {/* Connecting Track & Dots Row */}
            <div className="grid grid-cols-6 relative mb-4 items-center">
              {/* Background Track Line */}
              <div className="absolute left-[8.333%] right-[8.333%] top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
              {/* Active Progress Track Line */}
              <div
                className="absolute left-[8.333%] top-1/2 -translate-y-1/2 h-0.5 bg-[#3b99ed] transition-all duration-500 z-0"
                style={{ width: `${(currentStepIdx / (timelineStages.length - 1)) * 83.333}%` }}
              />

              {timelineStages.map((stage, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={stage.key} className="relative z-10 flex items-center justify-center">
                    <div
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#3b99ed] ring-2 ring-blue-100'
                          : isCurrent
                          ? 'bg-[#3b99ed] ring-4 ring-blue-100 scale-125'
                          : 'bg-slate-300 border-2 border-white'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Stage Names & Short Descriptions Row */}
            <div className="grid grid-cols-6 text-center gap-2">
              {timelineStages.map((stage, idx) => {
                const isCurrent = idx === currentStepIdx;
                const isPassed = idx <= currentStepIdx;
                return (
                  <div key={stage.key} className="space-y-1">
                    <h4
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-[#3b99ed]'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400 font-normal'
                      }`}
                    >
                      {stage.label}
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-tight font-normal hidden sm:block">
                      {stage.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ACTION BUTTONS (REFRESH / CONTACT SHOP) */}
        <section className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={fetchTrackingData}
            className="h-11 px-8 bg-[#3b99ed] hover:bg-[#2b88dc] text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer min-w-[160px]"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {ticket.shop.whatsapp || ticket.shop.phone ? (
            <a
              href={ticket.shop.whatsapp ? `https://wa.me/${ticket.shop.whatsapp.replace(/\D/g, '')}` : `tel:${ticket.shop.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-6 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer min-w-[160px]"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" /> Contact Shop
            </a>
          ) : (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-11 px-6 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" /> Go to Home Page
            </button>
          )}
        </section>

        {/* DEVICE DETAILS & REPAIR FEED ACCORDION CARDS */}
        <section className="max-w-2xl mx-auto space-y-4 pt-6">
          {/* Device Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Device Specifications</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Item & Model</span>
                <span className="font-bold text-slate-800">{ticket.device.title}</span>
              </div>
              {ticket.device.serialNumber && (
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Serial / IMEI</span>
                  <span className="font-mono font-bold text-slate-800">{ticket.device.serialNumber}</span>
                </div>
              )}
              {ticket.reportedIssue && (
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block font-medium">Reported Issue</span>
                  <span className="font-medium text-slate-700">{ticket.reportedIssue}</span>
                </div>
              )}
            </div>
          </div>

          {/* Intake Photos */}
          {ticket.intakePhotos.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Drop-Off Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {ticket.intakePhotos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white block hover:opacity-90 transition-opacity">
                    <img src={url} alt={`Drop-off photo ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}



          {/* Status Timeline History Log */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Activity Log</h3>
            <div className="space-y-3">
              {ticket.statusHistory.map((item, idx) => (
                <div key={item.id || idx} className="flex items-start justify-between text-xs py-1 border-b border-slate-200/40 last:border-none">
                  <div>
                    <span className="font-bold text-slate-800">{item.statusLabel}</span>
                    {item.customerNote && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.customerNote}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">{formatEventTime(item.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-8 text-xs text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-1 font-semibold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-[#3b99ed]" /> Powered by ZevioDesk
        </p>
        <p className="text-[10px]">Secure Repair Tracking Service</p>
      </footer>
    </div>
  );
};
