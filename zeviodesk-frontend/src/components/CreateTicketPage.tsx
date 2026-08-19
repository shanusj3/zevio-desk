import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronDown, Image, Loader2, Plus, Search, Trash2, Upload, UserPlus, Video, X, Activity, AlertCircle, ShieldCheck } from 'lucide-react';
import { CreateTicketPayload, Customer, TenantUser, ticketsApi } from '../lib/api';
import { ItemModelSearch, CatalogResolution } from './ItemModelSearch';
import { useCustomerSearchQuery } from '../hooks/useCustomersQuery';
import { useCreateTicketMutation } from '../hooks/useTicketsQuery';
import { useUsersQuery } from '../hooks/useUsersQuery';
import { useAppStore } from '../store/useAppStore';
import { navigate, ticketDetailPath } from '../lib/navigation';
import { CreateCustomerModal } from './CreateCustomerModal';
import { CreateEmployeeModal } from './CreateEmployeeModal';

interface CreateTicketPageProps {
  onBack: () => void;
}


const today = () => new Date().toISOString().slice(0, 10);


type Attachment = { file: File; preview: string; type: 'photo' | 'video'; uploading: boolean; url?: string; error?: string };

export function CreateTicketPage({ onBack }: CreateTicketPageProps) {
  const { showToast } = useAppStore();
  const createMutation = useCreateTicketMutation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [serviceDate, setServiceDate] = useState(today);
  const [technicianQuery, setTechnicianQuery] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState<TenantUser | null>(null);
  const [isTechnicianPickerOpen, setIsTechnicianPickerOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const technicianPickerRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [tempTicketId] = useState(() => crypto.randomUUID());
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [catalogResolution, setCatalogResolution] = useState<CatalogResolution>({ model: '', itemCategory: '', brand: '', globalCatalogItemId: null, tenantCatalogItemId: null, state: 'idle' });
  const [formData, setFormData] = useState({ serialNumber: '', reportedIssue: '', itemCondition: '', accessories: '', priority: 'NORMAL' as 'NORMAL' | 'URGENT' | 'WARRANTY', advanceAmount: '', paymentMethod: 'CASH', advanceNotes: '' });
  const { data: customers = [], isFetching } = useCustomerSearchQuery(debouncedQuery);
  const { data: staff = [] } = useUsersQuery(true);
  const technicians = staff.filter((user) => user.role === 'TECHNICIAN');
  const matchingTechnicians = technicians.filter((user) => {
    const search = technicianQuery.trim().toLowerCase();
    return !search || user.name.toLowerCase().includes(search) || (user.phone || '').toLowerCase().includes(search);
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setIsPickerOpen(false);
      if (technicianPickerRef.current && !technicianPickerRef.current.contains(event.target as Node)) setIsTechnicianPickerOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);


  const inputStyle = 'h-[52px] w-full rounded-lg border border-white/[0.07] bg-[#252d3e] px-4 text-sm text-white outline-none transition placeholder:text-[#9aa1b0] focus:border-[#d9a743] focus:ring-2 focus:ring-[#d9a743]/15';
  const labelStyle = 'mb-2 block text-sm font-semibold text-[#edf0f6]';
  const setField = (field: keyof typeof formData, value: string) => setFormData((current) => ({ ...current, [field]: value }));

  const chooseCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setQuery(customer.name);
    setIsPickerOpen(false);
    setError(null);
  };

  const handleCustomerCreated = (customer: Customer) => {
    chooseCustomer(customer);
    setIsCustomerModalOpen(false);
  };

  const handleStaffCreated = (employee: import('../lib/api').TenantUser) => {
    setSelectedTechnician(employee);
    setTechnicianQuery(employee.name);
    setIsStaffModalOpen(false);
  };

  const addFiles = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const files = Array.from(event.target.files || []);
    const currentCount = attachments.filter((item) => item.type === type).length;
    const limit = type === 'photo' ? 12 : 2;
    const maxSize = type === 'photo' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    for (const file of files.slice(0, Math.max(0, limit - currentCount))) {
      if (file.size > maxSize) { showToast(`${file.name} is too large`, 'warning'); continue; }
      const preview = URL.createObjectURL(file);
      setAttachments((items) => [...items, { file, preview, type, uploading: true }]);
      try {
        const { url, fields, fileUrl } = await ticketsApi.getAttachmentPresign(tempTicketId, file.type, type);
        await ticketsApi.uploadAttachment(url, fields, file);
        setAttachments((items) => items.map((item) => item.preview === preview ? { ...item, uploading: false, url: fileUrl } : item));
      } catch {
        setAttachments((items) => items.map((item) => item.preview === preview ? { ...item, uploading: false, error: 'Upload failed' } : item));
      }
    }
    event.target.value = '';
  };

  const removeAttachment = (preview: string) => setAttachments((items) => {
    const attachment = items.find((item) => item.preview === preview);
    if (attachment) URL.revokeObjectURL(attachment.preview);
    return items.filter((item) => item.preview !== preview);
  });
  const handleSubmit = async () => {
    if (!selectedCustomer) return setError('Please select a customer');
    if (!catalogResolution.model.trim()) return setError('Please enter an item or model name');
    if (!catalogResolution.itemCategory) return setError('This item is not in the catalog. Please select its category.');
    if (attachments.some((attachment) => attachment.uploading)) return setError('Please wait for attachments to finish uploading');
    const payload: CreateTicketPayload = {
      customerId: selectedCustomer.id,
      assignedToId: selectedTechnician?.id || undefined,
      title: `${catalogResolution.itemCategory}${catalogResolution.model ? ` - ${catalogResolution.model}` : ''}`,
      description: formData.reportedIssue || formData.itemCondition || 'Ticket created from intake form.',
      priority: formData.priority,
      status: 'RECEIVED',
      itemCategory: catalogResolution.itemCategory || undefined,
      brand: catalogResolution.brand || undefined,
      model: catalogResolution.model || undefined,
      serialNumber: formData.serialNumber || undefined,
      reportedIssue: formData.reportedIssue || undefined,
      itemCondition: formData.itemCondition || undefined,
      accessories: formData.accessories || undefined,
      advanceAmount: formData.advanceAmount ? parseFloat(formData.advanceAmount) : undefined,
      paymentMethod: formData.paymentMethod,
      advanceNotes: formData.advanceNotes || undefined,
      attachments: attachments.filter((attachment) => attachment.url).map((attachment) => ({ id: crypto.randomUUID(), url: attachment.url!, type: attachment.type, stage: 'intake', uploadedAt: new Date().toISOString(), fileName: attachment.file.name })),
    };
    try {
      const created = await createMutation.mutateAsync(payload);
      showToast('Ticket created successfully', 'success');
      navigate(ticketDetailPath(created.id));
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    }
  };

  return (
    <div className="min-h-screen bg-[#090e17] px-3 py-3 text-white sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] bg-[#090e17]">
        <div className="sticky top-0 z-30 flex flex-col gap-4 bg-[#090e17] px-5 py-5 sm:flex-row sm:items-center sm:px-8">
          <button type="button" onClick={onBack} aria-label="Back to tickets" title="Back to tickets" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1b2332] text-[#f0c65f] transition hover:bg-[#252e3f]"><ArrowLeft className="size-5" /></button>
          <div><h1 className="text-2xl font-bold tracking-tight">Create New Ticket</h1><p className="mt-1 text-sm text-[#b9bfcb]">Fill in the details below to create a new ticket.</p></div>
        </div>

        <div>
          <div className="p-5 sm:p-8">
            {error && <div className="mb-5 rounded-lg border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}
            <div className="grid grid-cols-1 gap-x-8 gap-y-7 lg:grid-cols-3">
              <div ref={pickerRef} className="relative lg:col-span-2">
                <label className={labelStyle}>Select Customer <span className="text-[#f0c65f]">*</span></label>
                <div className={`flex h-[52px] items-center rounded-lg border bg-[#171f2e] transition ${isPickerOpen ? 'border-[#d9a743] ring-2 ring-[#d9a743]/15' : 'border-[#d9a743]/70'}`}>
                  <Search className="ml-4 size-5 shrink-0 text-[#c5cad3]" />
                  <input value={query} onFocus={() => setIsPickerOpen(true)} onChange={(event) => { setQuery(event.target.value); setSelectedCustomer(null); setIsPickerOpen(true); }} placeholder="Search by customer name or number" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-[#b2b8c4]" />
                  {query && <button type="button" onClick={() => { setQuery(''); setSelectedCustomer(null); }} className="mr-3 p-1 text-[#c5cad3] hover:text-white"><X className="size-4" /></button>}
                  {!query && <ChevronDown className="mr-4 size-4 text-[#c5cad3]" />}
                </div>
                {selectedCustomer && !isPickerOpen && <div className="mt-2 flex items-center gap-2 text-xs text-[#a9d7a8]"><Check className="size-4" />Selected: {selectedCustomer.name}{selectedCustomer.phone ? ` � ${selectedCustomer.phone}` : ''}</div>}
                {isPickerOpen && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#39445a] bg-[#192132] shadow-2xl shadow-black/40">
                    <div className="max-h-56 overflow-y-auto p-2">
                      {isFetching && <div className="flex items-center gap-2 px-3 py-4 text-sm text-[#aab1be]"><Loader2 className="size-4 animate-spin" />Searching customers�</div>}
                      {!isFetching && !query && <div className="px-3 py-4 text-sm text-[#aab1be]">Start typing a name or phone number.</div>}
                      {!isFetching && query && customers.length > 0 && <><p className="px-3 pb-2 pt-1 text-xs text-[#aab1be]">Matching customers</p>{customers.map((customer) => <button key={customer.id} type="button" onClick={() => chooseCustomer(customer)} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-white/[0.06]"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#312b1d] text-sm font-bold text-[#f0c65f]">{customer.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{customer.name}</span><span className="block truncate text-xs text-[#aab1be]">{customer.phone || 'No phone number'}{customer.email ? ` � ${customer.email}` : ''}</span></span></button>)}</>}
                      {!isFetching && query && customers.length === 0 && <div className="px-3 py-3 text-sm text-[#aab1be]">No matching customer found.</div>}
                    </div>
                    {query && !isFetching && customers.length === 0 && (
                      <div className="border-t border-white/[0.08] px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setIsCustomerModalOpen(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d9a743] hover:bg-[#c5963b] px-4 py-2.5 text-sm font-semibold text-white transition duration-200 cursor-pointer"
                        >
                          <Plus className="size-4" />
                          Add new Customer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-7">
                <div><label htmlFor="ticket-date" className={labelStyle}>Date <span className="text-[#f0c65f]">*</span></label><input id="ticket-date" type="date" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} className={`${inputStyle} [color-scheme:dark]`} /></div>
                <div ref={technicianPickerRef} className="relative">
                  <label className={labelStyle}>Assign Technician <span className="text-[#aab1be]">(optional)</span></label>
                  <div className={`flex h-[52px] items-center rounded-lg border bg-[#171f2e] transition ${isTechnicianPickerOpen ? 'border-[#d9a743] ring-2 ring-[#d9a743]/15' : 'border-white/[0.07]'}`}>
                    <Search className="ml-4 size-5 shrink-0 text-[#c5cad3]" />
                    <input value={technicianQuery} onFocus={() => setIsTechnicianPickerOpen(true)} onChange={(event) => { setTechnicianQuery(event.target.value); setSelectedTechnician(null); setIsTechnicianPickerOpen(true); }} placeholder="Search by technician name or number" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-[#b2b8c4]" />
                    {technicianQuery && <button type="button" onClick={() => { setTechnicianQuery(''); setSelectedTechnician(null); }} className="mr-3 p-1 text-[#c5cad3] hover:text-white"><X className="size-4" /></button>}
                    {!technicianQuery && <ChevronDown className="mr-4 size-4 text-[#c5cad3]" />}
                  </div>
                  {isTechnicianPickerOpen && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#39445a] bg-[#192132] shadow-2xl shadow-black/40"><div className="max-h-56 overflow-y-auto p-2">{matchingTechnicians.length > 0 ? matchingTechnicians.map((technician) => <button key={technician.id} type="button" onClick={() => { setSelectedTechnician(technician); setTechnicianQuery(technician.name); setIsTechnicianPickerOpen(false); }} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-white/[0.06]"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#312b1d] text-sm font-bold text-[#f0c65f]">{technician.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{technician.name}</span><span className="block truncate text-xs text-[#aab1be]">{technician.phone || 'No phone number'}</span></span></button>) : <div className="px-3 py-4 text-sm text-[#aab1be]">No matching technician found.</div>}</div><div className="border-t border-white/[0.08] px-3 py-3"><button type="button" onClick={() => { setIsTechnicianPickerOpen(false); setIsStaffModalOpen(true); }} className="flex items-center gap-3 text-left"><span className="flex size-9 items-center justify-center rounded-full bg-[#d9a743]/15 text-[#f0c65f]"><UserPlus className="size-5" /></span><span><span className="block text-sm font-semibold text-[#f0c65f]">Add new staff</span><span className="block text-xs text-[#aab1be]">Register a technician and assign them</span></span></button></div></div>}
                </div>
              </div>
            </div>

            <div className="my-7 border-t border-white/[0.08]" />

            {/* Priority Selector */}
            <div className="mb-7">
              <label className={labelStyle}>Priority</label>
              <div className="flex gap-3">
                {(['NORMAL', 'URGENT', 'WARRANTY'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, priority: p }))}
                    className={`flex-1 h-11 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

            <div className="grid grid-cols-1 gap-x-8 gap-y-7 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ItemModelSearch
                  value={catalogResolution.model}
                  onChange={setCatalogResolution}
                  required
                />
              </div>
              <div><label htmlFor="serial" className={labelStyle}>Serial Number / IMEI / VIN</label><input id="serial" value={formData.serialNumber} onChange={(event) => setField('serialNumber', event.target.value)} placeholder="Enter serial number, IMEI or VIN" className={inputStyle} /></div>
            </div>
            <div className="mt-7 space-y-7">
              <div>
                <label htmlFor="reported-issue" className={labelStyle}>Reported Problem / Issue <span className="text-[#f0c65f]">*</span></label>
                <div className="relative">
                  <textarea
                    id="reported-issue"
                    value={formData.reportedIssue}
                    onChange={(event) => setField('reportedIssue', event.target.value.slice(0, 1000))}
                    placeholder="Describe the problem or issue reported by the customer (e.g., screen cracked, won't turn on, battery draining fast, water damage...)"
                    className="min-h-[130px] w-full resize-none rounded-lg border border-white/[0.07] bg-[#252d3e] p-4 pb-8 text-sm text-white outline-none placeholder:text-[#9aa1b0] focus:border-[#d9a743] focus:ring-2 focus:ring-[#d9a743]/15"
                  />
                  <span className="absolute bottom-3 right-4 text-xs text-[#aab1be]">{formData.reportedIssue.length}/1000</span>
                </div>
              </div>
              <div><label htmlFor="condition" className={labelStyle}>Physical Condition on Intake</label><div className="relative"><textarea id="condition" value={formData.itemCondition} onChange={(event) => setField('itemCondition', event.target.value.slice(0, 500))} placeholder="Describe the physical condition of the item upon intake" className="min-h-[112px] w-full resize-none rounded-lg border border-white/[0.07] bg-[#252d3e] p-4 pb-8 text-sm text-white outline-none placeholder:text-[#9aa1b0] focus:border-[#d9a743] focus:ring-2 focus:ring-[#d9a743]/15" /><span className="absolute bottom-3 right-4 text-xs text-[#aab1be]">{formData.itemCondition.length}/500</span></div></div>
              <div>
                <div className="mb-2 flex items-center justify-between"><label className={labelStyle}>Intake Photos &amp; Videos</label><span className="text-xs text-[#94A3B8]">{attachments.filter((item) => item.type === 'photo').length}/12 photos � {attachments.filter((item) => item.type === 'video').length}/2 videos</span></div>
                <div className="rounded-xl border border-dashed border-[#344056] bg-[#141b2b] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => photoInputRef.current?.click()} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#344056] bg-[#1b2536] text-sm font-semibold text-[#CBD5E1] hover:border-[#D99B26]/60 hover:text-white"><Image className="size-4" />Add Photos</button><button type="button" onClick={() => videoInputRef.current?.click()} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#344056] bg-[#1b2536] text-sm font-semibold text-[#CBD5E1] hover:border-[#D99B26]/60 hover:text-white"><Video className="size-4" />Add Videos</button></div>
                  <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => addFiles(event, 'photo')} /><input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(event) => addFiles(event, 'video')} />
                  {attachments.length > 0 && <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">{attachments.map((attachment) => <div key={attachment.preview} className="group relative aspect-square overflow-hidden rounded-lg border border-[#344056] bg-[#0c1017]">{attachment.type === 'photo' ? <img src={attachment.preview} alt={attachment.file.name} className="size-full object-cover" /> : <video src={attachment.preview} className="size-full object-cover" />}{attachment.uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Loader2 className="size-5 animate-spin text-[#D99B26]" /></div>}{attachment.error && <div className="absolute inset-x-0 bottom-0 bg-red-950/85 p-1 text-center text-[10px] text-red-200">{attachment.error}</div>}<button type="button" onClick={() => removeAttachment(attachment.preview)} className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"><Trash2 className="size-3" /></button></div>)}</div>}
                </div>
              </div>              <div><label htmlFor="accessories" className={labelStyle}>Accessories Received</label><div className="relative"><textarea id="accessories" value={formData.accessories} onChange={(event) => setField('accessories', event.target.value.slice(0, 500))} placeholder="List all accessories received with the item (e.g., charger, box, cable, documents etc.)" className="min-h-[112px] w-full resize-none rounded-lg border border-white/[0.07] bg-[#252d3e] p-4 pb-8 text-sm text-white outline-none placeholder:text-[#9aa1b0] focus:border-[#d9a743] focus:ring-2 focus:ring-[#d9a743]/15" /><span className="absolute bottom-3 right-4 text-xs text-[#aab1be]">{formData.accessories.length}/500</span></div></div>
            </div>

            {/* Advance Payment Section */}
            <div className="my-7 border-t border-white/[0.08]" />
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1">Advance Received?</h3>
              <p className="text-xs text-[#9aa1b0]">Optional. Record any upfront payment collected from the customer.</p>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-7 lg:grid-cols-3">
              <div>
                <label htmlFor="advance-amount" className={labelStyle}>Amount ($)</label>
                <input id="advance-amount" type="number" min="0" step="0.01" value={formData.advanceAmount} onChange={(event) => setField('advanceAmount', event.target.value)} placeholder="0.00" className={inputStyle} />
              </div>
              <div>
                <label htmlFor="payment-method" className={labelStyle}>Payment Method</label>
                <div className="relative">
                  <select id="payment-method" value={formData.paymentMethod} onChange={(event) => setField('paymentMethod', event.target.value)} className={`${inputStyle} appearance-none pr-12`}>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card / POS</option>
                    <option value="UPI">UPI / Digital</option>
                    <option value="TRANSFER">Bank Transfer</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#c5cad3]" />
                </div>
              </div>
              <div>
                <label htmlFor="advance-notes" className={labelStyle}>Notes</label>
                <input id="advance-notes" value={formData.advanceNotes} onChange={(event) => setField('advanceNotes', event.target.value)} placeholder="e.g. For diagnostic fee" className={inputStyle} />
              </div>
            </div>

          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] bg-[#111827]/80 px-5 py-5 sm:flex-row sm:justify-end sm:px-8"><button type="button" onClick={onBack} className="h-11 rounded-lg border border-[#d9a743] px-7 text-sm font-semibold text-[#f0c65f] transition hover:bg-[#d9a743]/10">Cancel</button><button type="button" onClick={handleSubmit} disabled={createMutation.isPending} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#f2ca70,#d79c2a)] px-8 text-sm font-bold text-[#15171d] transition hover:brightness-105 disabled:opacity-60">{createMutation.isPending && <Loader2 className="size-4 animate-spin" />}<Plus className="size-4" />Create Ticket</button></div>
        </div>
      </div>
      <CreateCustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} customerToEdit={null} onCreated={handleCustomerCreated} />
      <CreateEmployeeModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} employeeToEdit={null} onCreated={handleStaffCreated} />
    </div>
  );
}


