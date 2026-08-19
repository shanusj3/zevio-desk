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
  ShieldCheck,
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

const inputStyle = 'h-[52px] w-full rounded-lg border border-white/[0.07] bg-[#252d3e] px-4 text-sm text-white outline-none transition placeholder:text-[#9aa1b0] focus:border-[#d9a743] focus:ring-2 focus:ring-[#d9a743]/15';
const labelStyle = 'mb-2 block text-sm font-semibold text-[#edf0f6]';

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
    <div className="min-h-screen bg-[#090e17] px-3 py-3 text-white sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-4xl bg-[#090e17]">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 flex flex-col gap-4 bg-[#090e17]/95 backdrop-blur-sm border-b border-[#1b2536] px-5 py-4 sm:flex-row sm:items-center justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1b2332] text-[#f0c65f] transition hover:bg-[#252e3f] cursor-pointer"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Edit Ticket</h1>
              <p className="text-xs text-[#64748B] font-mono mt-0.5">#{formatTicketReference(ticket)}</p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 h-10 bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#D99B26]/10 cursor-pointer disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        <div className="p-5 sm:p-8 space-y-8">
          
          {/* Status & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelStyle}>Status</label>
              <div className="relative">
                <select 
                  value={formData.status} 
                  onChange={(e) => setField('status', e.target.value as Ticket['status'])}
                  className={`${inputStyle} appearance-none pr-12`}
                >
                  <option value="RECEIVED">Received</option>
                  <option value="DIAGNOSING">Diagnosing</option>
                  <option value="WAITING_FOR_PARTS">Waiting for Parts</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                  {!isTechnician && <option value="COMPLETED">Completed</option>}
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#c5cad3]" />
              </div>
            </div>
            
            <div>
              <label className={labelStyle}>Priority</label>
              <div className="flex gap-2 h-[52px]">
                {(['NORMAL', 'URGENT', 'WARRANTY'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setField('priority', p)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      formData.priority === p
                        ? p === 'URGENT'
                          ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#F87171]'
                          : p === 'WARRANTY'
                          ? 'bg-[#2563EB]/20 border-[#2563EB] text-[#93C5FD]'
                          : 'bg-[#D99B26]/20 border-[#D99B26] text-[#D99B26]'
                        : 'bg-[#141b2b] border-[#23314a] text-[#64748B] hover:border-[#334155]'
                    }`}
                  >
                    {p === 'NORMAL' && <Activity className="w-4 h-4" />}
                    {p === 'URGENT' && <AlertCircle className="w-4 h-4" />}
                    {p === 'WARRANTY' && <ShieldCheck className="w-4 h-4" />}
                    {p === 'NORMAL' ? 'Normal' : p === 'URGENT' ? 'Urgent' : 'Warranty'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.08]" />

          {/* Assignment & Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div ref={technicianPickerRef} className="relative">
              <label className={labelStyle}>Assign Technician</label>
              {isTechnician ? (
                <div className="flex h-[52px] items-center rounded-lg border border-white/[0.07] bg-[#141b2b] px-4 gap-3 opacity-60 cursor-not-allowed" title="Only Advisors and Admins can reassign tickets">
                  <Search className="size-5 shrink-0 text-[#64748B]" />
                  <span className="text-sm text-[#64748B]">{ticket.assignedTo?.name || 'Unassigned'}</span>
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-[#475569] bg-[#1b2536] px-2 py-0.5 rounded">Locked</span>
                </div>
              ) : (
                <div className={`flex h-[52px] items-center rounded-lg border bg-[#171f2e] transition ${isTechnicianPickerOpen ? 'border-[#d9a743] ring-2 ring-[#d9a743]/15' : 'border-white/[0.07]'}`}>
                  <Search className="ml-4 size-5 shrink-0 text-[#c5cad3]" />
                  <input 
                    value={technicianQuery} 
                    onFocus={() => setIsTechnicianPickerOpen(true)} 
                    onChange={(event) => { setTechnicianQuery(event.target.value); setSelectedTechnician(null); setIsTechnicianPickerOpen(true); }} 
                    placeholder="Search by technician name" 
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-[#b2b8c4]" 
                  />
                  {technicianQuery && <button type="button" onClick={() => { setTechnicianQuery(''); setSelectedTechnician(null); }} className="mr-3 p-1 text-[#c5cad3] hover:text-white cursor-pointer"><X className="size-4" /></button>}
                  {!technicianQuery && <ChevronDown className="mr-4 size-4 text-[#c5cad3]" />}
                </div>
              )}
              
              {isTechnicianPickerOpen && !isTechnician && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#39445a] bg-[#192132] shadow-2xl shadow-black/40">
                  <div className="max-h-56 overflow-y-auto p-2">
                    {isStaffLoading ? (
                      <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
                    ) : matchingTechnicians.length > 0 ? (
                      matchingTechnicians.map((technician) => (
                        <button 
                          key={technician.id} 
                          type="button" 
                          onClick={() => { setSelectedTechnician(technician); setTechnicianQuery(technician.name); setIsTechnicianPickerOpen(false); }} 
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-white/[0.06] cursor-pointer"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#312b1d] text-sm font-bold text-[#f0c65f]">
                            {technician.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-white">{technician.name}</span>
                            <span className="block truncate text-xs text-[#aab1be]">{technician.phone || 'No phone number'}</span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-[#aab1be]">No matching technician found.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={labelStyle}>Estimated Cost ($)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                value={formData.estimatedCost} 
                onChange={(e) => setField('estimatedCost', e.target.value)}
                placeholder="e.g. 150.00" 
                className={inputStyle} 
              />
            </div>
          </div>
          
          <div className="border-t border-white/[0.08]" />

          {/* Details */}
          <div className="space-y-6">
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
                  className="min-h-[160px] w-full resize-none rounded-lg border border-white/[0.07] bg-[#252d3e] p-4 pb-8 text-sm text-white outline-none placeholder:text-[#9aa1b0] focus:border-[#d9a743] focus:ring-2 focus:ring-[#d9a743]/15"
                />
                <span className="absolute bottom-3 right-4 text-xs text-[#aab1be]">{formData.description.length}/1000</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
