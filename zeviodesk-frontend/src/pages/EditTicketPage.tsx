import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  ChevronDown,
  Check,
  Loader2,
  Save,
  X,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { Ticket, TenantUser } from '../lib/api';
import { formatTicketReference } from '../lib/ticketDisplay';
import { useUpdateTicketMutation } from '../hooks/useTicketsQuery';
import { useUsersQuery } from '../hooks/useUsersQuery';
import { useAppStore } from '../store/useAppStore';

interface EditTicketPageProps {
  ticket: Ticket;
  onBack: () => void;
  onSuccess: () => void;
}

const inputStyle = 'h-[44px] w-full rounded-xl border border-[#cbd5e1] bg-white px-4 text-xs font-semibold text-[#1e293b] outline-none transition-all placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15';
const labelStyle = 'block text-xs font-bold text-[#1e293b] uppercase tracking-wider mb-2';

export function EditTicketPage({ ticket, onBack, onSuccess }: EditTicketPageProps) {
  const { showToast, currentUser } = useAppStore();
  const isTechnician = currentUser?.role === 'TECHNICIAN';
  const updateMutation = useUpdateTicketMutation();
  
  const [formData, setFormData] = useState({
    title: ticket.title || '',
    description: ticket.description || '',
    priority: ticket.priority,
    status: ticket.status,
    estimatedCost: ticket.estimatedCost?.toString() || '',
    itemCondition: ticket.itemCondition || '',
    accessories: ticket.accessories || '',
  });

  const [technicianQuery, setTechnicianQuery] = useState(ticket.assignedTo?.name || '');
  const [selectedTechnician, setSelectedTechnician] = useState<{ id: string; name: string } | null>(
    ticket.assignedTo ? { id: ticket.assignedTo.id, name: ticket.assignedTo.name } : null
  );
  const [isTechnicianPickerOpen, setIsTechnicianPickerOpen] = useState(false);
  const technicianPickerRef = useRef<HTMLDivElement>(null);
  
  const { data: staff = [], isLoading: isStaffLoading } = useUsersQuery(true);
  const technicians = staff.filter((user) => user.role === 'TECHNICIAN');
  const matchingTechnicians = technicians.filter((user) => {
    const search = technicianQuery.trim().toLowerCase();
    return !search || user.name.toLowerCase().includes(search) || (user.phone || '').toLowerCase().includes(search);
  });

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (technicianPickerRef.current && !technicianPickerRef.current.contains(event.target as Node)) {
        setIsTechnicianPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const setField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToast('Title is required', 'warning');
      return;
    }
    
    try {
      await updateMutation.mutateAsync({
        id: ticket.id,
        data: {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          itemCondition: formData.itemCondition || undefined,
          accessories: formData.accessories || undefined,
          ...(isTechnician ? {} : { assignedToId: selectedTechnician?.id || null }),
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
        }
      });
      showToast('Ticket updated successfully', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to update ticket', 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] pb-24 text-[#1e293b] -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
      {/* ──── TOP BANNER HEADER (MATCHES OTHER PAGES) ── */}
      <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-30 bg-gradient-to-r from-[#dbeafe] via-[#e2e8f0] to-[#f1f5f9] border-b border-[#cbd5e1] px-6 py-4 shadow-xs transition-all backdrop-blur-md">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Header Title with Circular Arrow Back Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="size-9 rounded-full bg-white border border-[#cbd5e1] text-[#1e293b] flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="size-4.5 text-[#1e293b]" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-[#1e293b] tracking-tight">
                Edit Repair Ticket
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">#{formatTicketReference(ticket)}</p>
            </div>
          </div>

          {/* Header Action Buttons (Cancel & Save) */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2 rounded-full bg-white border border-[#cbd5e1] text-xs font-semibold text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={handleSubmit}
              className="px-6 py-2 rounded-full bg-[#116dff] hover:bg-[#0d5fd9] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {updateMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Status & Priority Card */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>Status</label>
              <div className="relative">
                <select 
                  value={formData.status} 
                  onChange={(e) => setField('status', e.target.value as Ticket['status'])}
                  className={`${inputStyle} appearance-none pr-12 cursor-pointer font-bold`}
                >
                  <option value="RECEIVED">Received</option>
                  <option value="DIAGNOSING">Diagnosing</option>
                  <option value="WAITING_FOR_PARTS">Waiting for Parts</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
            
            <div>
              <label className={labelStyle}>Priority</label>
              <div className="flex gap-3 h-[44px]">
                {(['NORMAL', 'URGENT'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setField('priority', p)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formData.priority === p
                        ? p === 'URGENT'
                          ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                          : 'bg-amber-50 border-amber-300 text-amber-700 shadow-2xs'
                        : 'bg-slate-50 border-[#cbd5e1] text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p === 'NORMAL' && <Activity className="w-4 h-4" />}
                    {p === 'URGENT' && <AlertCircle className="w-4 h-4" />}
                    {p === 'NORMAL' ? 'Normal' : 'Urgent'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Assignment & Estimated Cost Card */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div ref={technicianPickerRef} className="relative">
              <label className={labelStyle}>Assign Technician</label>
              {isTechnician ? (
                <div className="flex h-[44px] items-center rounded-xl border border-[#cbd5e1] bg-slate-100 px-4 gap-3 opacity-70 cursor-not-allowed" title="Only Advisors and Admins can reassign tickets">
                  <Search className="size-4 shrink-0 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">{ticket.assignedTo?.name || 'Unassigned'}</span>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Locked</span>
                </div>
              ) : (
                <div className={`flex h-[44px] items-center rounded-xl border bg-white transition ${isTechnicianPickerOpen ? 'border-[#116dff] ring-2 ring-[#116dff]/15' : 'border-[#cbd5e1]'}`}>
                  <Search className="ml-4 size-4 shrink-0 text-slate-400" />
                  <input 
                    value={technicianQuery} 
                    onFocus={() => setIsTechnicianPickerOpen(true)} 
                    onChange={(event) => { setTechnicianQuery(event.target.value); setSelectedTechnician(null); setIsTechnicianPickerOpen(true); }} 
                    placeholder="Search by technician name..." 
                    className="min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-[#1e293b] outline-none placeholder:text-slate-400" 
                  />
                  {technicianQuery && (
                    <button type="button" onClick={() => { setTechnicianQuery(''); setSelectedTechnician(null); }} className="mr-3 p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="size-3.5" />
                    </button>
                  )}
                  {!technicianQuery && <ChevronDown className="mr-4 size-4 text-slate-400" />}
                </div>
              )}
              
              {isTechnicianPickerOpen && !isTechnician && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[#cbd5e1] bg-white shadow-xl">
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                    {isStaffLoading ? (
                      <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-[#116dff]" /></div>
                    ) : matchingTechnicians.length > 0 ? (
                      matchingTechnicians.map((technician) => (
                        <button 
                          key={technician.id} 
                          type="button" 
                          onClick={() => { setSelectedTechnician(technician); setTechnicianQuery(technician.name); setIsTechnicianPickerOpen(false); }} 
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-blue-50/60 cursor-pointer"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-[#116dff]">
                            {technician.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold text-[#1e293b]">{technician.name}</span>
                            <span className="block truncate text-[11px] text-slate-500">{technician.phone || 'No phone number'}</span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-xs text-slate-500">No matching technician found.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={labelStyle}>Estimated Cost (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                value={formData.estimatedCost} 
                onChange={(e) => setField('estimatedCost', e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="e.g. 150.00" 
                className={inputStyle} 
              />
            </div>
          </div>
        </div>

        {/* Intake & Condition Card */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">
              Intake &amp; Condition
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Physical Condition on Intake */}
            <div>
              <label className={labelStyle}>Physical Condition on Intake</label>
              <div className="relative">
                <textarea
                  value={formData.itemCondition}
                  maxLength={300}
                  onChange={(e) => setField('itemCondition', e.target.value)}
                  placeholder="e.g. Screen cracked, minor scratches on back, body dent..."
                  className="min-h-[120px] w-full resize-none rounded-xl border border-[#cbd5e1] bg-white p-3.5 pb-8 text-xs font-medium text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 transition-all"
                />
                <span className="absolute bottom-3 right-3 text-[11px] text-[#94a3b8] font-medium">
                  {formData.itemCondition.length}/300
                </span>
              </div>
            </div>

            {/* Accessories Received */}
            <div>
              <label className={labelStyle}>Accessories Received</label>
              <div className="relative">
                <textarea
                  value={formData.accessories}
                  maxLength={200}
                  onChange={(e) => setField('accessories', e.target.value)}
                  placeholder="e.g. Charger, USB Cable, SIM Tray, Protective Case..."
                  className="min-h-[120px] w-full resize-none rounded-xl border border-[#cbd5e1] bg-white p-3.5 pb-8 text-xs font-medium text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 transition-all"
                />
                <span className="absolute bottom-3 right-3 text-[11px] text-[#94a3b8] font-medium">
                  {formData.accessories.length}/200
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Details Card */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <label className={labelStyle}>Ticket Title</label>
            <input 
              value={formData.title} 
              onChange={(e) => setField('title', e.target.value)} 
              className={inputStyle} 
            />
          </div>

          <div>
            <label className={labelStyle}>Description / Notes</label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => setField('description', e.target.value.slice(0, 1000))}
                placeholder="Additional notes about the ticket..."
                className="min-h-[140px] w-full resize-none rounded-xl border border-[#cbd5e1] bg-white p-4 pb-8 text-xs font-medium text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 transition-all"
              />
              <span className="absolute bottom-3 right-4 text-[11px] text-slate-400 font-medium">{formData.description.length}/1000</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
