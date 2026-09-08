import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Image,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Video,
  X,
  Activity,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Info,
  Play,
} from 'lucide-react';
import { AttachmentUploader } from '../components/attachments/AttachmentUploader';
import { CreateTicketPayload, Customer, TenantUser, ticketsApi } from '../lib/api';
import { ItemModelSearch, CatalogResolution } from '../components/ItemModelSearch';
import { useCustomerSearchQuery } from '../hooks/useCustomersQuery';
import { useCreateTicketMutation } from '../hooks/useTicketsQuery';
import { useUsersQuery } from '../hooks/useUsersQuery';
import { useAppStore } from '../store/useAppStore';
import { navigate, ticketDetailPath } from '../lib/navigation';
import { CreateCustomerModal } from '../components/CreateCustomerModal';
import { CreateEmployeeModal } from '../components/CreateEmployeeModal';

interface CreateTicketPageProps {
  onBack: () => void;
}

const getTodayDateString = () => new Date().toISOString().slice(0, 10);
const getFormattedTodayLabel = () => {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

type Attachment = {
  file: File;
  preview: string;
  type: 'photo' | 'video';
  uploading: boolean;
  url?: string;
  error?: string;
};

const COMMON_ACCESSORIES = ['Charger', 'SIM Tray', 'Cable', 'Box', 'Earphones'];
const CONDITION_TAGS = ['Screen cracked', 'Scratches on back', 'Water damage', 'Body dent', 'Camera glass broken'];

export function CreateTicketPage({ onBack }: CreateTicketPageProps) {
  const { showToast } = useAppStore();
  const createMutation = useCreateTicketMutation();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [serviceDate, setServiceDate] = useState(getTodayDateString);
  const [technicianQuery, setTechnicianQuery] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState<TenantUser | null>(null);
  const [isTechnicianPickerOpen, setIsTechnicianPickerOpen] = useState(false);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalInitialData, setCustomerModalInitialData] = useState<{ name?: string; phone?: string } | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenAddCustomer = () => {
    const trimmed = query.trim();
    if (trimmed) {
      const digitsOnly = trimmed.replace(/\D/g, '');
      const isPhone = digitsOnly.length >= 5 || (/^[\+\d\s\-\(\)]+$/.test(trimmed) && digitsOnly.length >= 3);
      if (isPhone) {
        setCustomerModalInitialData({ name: '', phone: digitsOnly || trimmed });
      } else {
        setCustomerModalInitialData({ name: trimmed, phone: '' });
      }
    } else {
      setCustomerModalInitialData(null);
    }
    setIsCustomerModalOpen(true);
  };

  const pickerRef = useRef<HTMLDivElement>(null);
  const technicianPickerRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [tempTicketId] = useState(() => crypto.randomUUID());
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [catalogResolution, setCatalogResolution] = useState<CatalogResolution>({
    model: '',
    itemCategory: '',
    brand: '',
    globalCatalogItemId: null,
    tenantCatalogItemId: null,
    source: 'CUSTOM',
  });

  // Form Fields
  const [serialNumber, setSerialNumber] = useState('');
  const [reportedIssue, setReportedIssue] = useState('');
  const [itemCondition, setItemCondition] = useState('');
  const [accessoriesText, setAccessoriesText] = useState('');
  const [description, setDescription] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [advanceReceived, setAdvanceReceived] = useState<boolean>(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false);
  const [cashAmount, setCashAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [advanceNotes, setAdvanceNotes] = useState('');

  const [photoAttachmentIds, setPhotoAttachmentIds] = useState<string[]>([]);
  const [videoAttachmentIds, setVideoAttachmentIds] = useState<string[]>([]);

  const photoAttachments = attachments.filter((a) => a.type === 'photo');
  const videoAttachments = attachments.filter((a) => a.type === 'video');

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

  const handleStaffCreated = (employee: TenantUser) => {
    setSelectedTechnician(employee);
    setTechnicianQuery(employee.name);
    setIsStaffModalOpen(false);
  };



  const addFiles = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const files = Array.from(event.target.files || []);
    const currentCount = attachments.filter((item) => item.type === type).length;
    const limit = type === 'photo' ? 4 : 2;
    const maxSize = type === 'photo' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (currentCount >= limit) {
      showToast(`Maximum ${limit} ${type === 'photo' ? 'images' : 'videos'} allowed`, 'warning');
      return;
    }
    for (const file of files.slice(0, Math.max(0, limit - currentCount))) {
      if (file.size > maxSize) {
        showToast(`${file.name} is too large`, 'warning');
        continue;
      }
      const preview = URL.createObjectURL(file);
      setAttachments((items) => [...items, { file, preview, type, uploading: true }]);
      try {
        const { url, fields, fileUrl } = await ticketsApi.getAttachmentPresign(tempTicketId, file.type, type);
        await ticketsApi.uploadAttachment(url, fields, file);
        setAttachments((items) =>
          items.map((item) => (item.preview === preview ? { ...item, uploading: false, url: fileUrl } : item))
        );
      } catch {
        setAttachments((items) =>
          items.map((item) => (item.preview === preview ? { ...item, uploading: false, error: 'Upload failed' } : item))
        );
      }
    }
    event.target.value = '';
  };

  const removeAttachment = (preview: string) =>
    setAttachments((items) => {
      const attachment = items.find((item) => item.preview === preview);
      if (attachment) URL.revokeObjectURL(attachment.preview);
      return items.filter((item) => item.preview !== preview);
    });

  const handleSubmit = async () => {
    setError(null);
    if (!selectedCustomer) return setError('Please select a customer');
    if (!catalogResolution.model.trim()) return setError('Please enter a device or model name');
    if (!reportedIssue.trim()) return setError('Please enter the reported problem / issue');
    if (attachments.some((a) => a.uploading)) return setError('Please wait for attachments to finish uploading');

    if (advanceReceived) {
      if (isSplitPayment) {
        const cash = parseFloat(cashAmount) || 0;
        const upi = parseFloat(upiAmount) || 0;
        const card = parseFloat(cardAmount) || 0;
        const totalSplit = cash + upi + card;
        if (totalSplit <= 0) {
          const msg = 'Payment intake is selected as Yes. Please enter an advance amount before saving.';
          showToast(msg, 'warning');
          return setError(msg);
        }
      } else {
        const numAdvance = parseFloat(advanceAmount);
        if (!advanceAmount.trim() || isNaN(numAdvance) || numAdvance <= 0) {
          const msg = 'Payment intake is selected as Yes. Please enter an advance amount before saving.';
          showToast(msg, 'warning');
          return setError(msg);
        }
      }
    }

    const titleText = catalogResolution.brand
      ? `${catalogResolution.brand} ${catalogResolution.model}`
      : catalogResolution.model;

    const payload: CreateTicketPayload = {
      customerId: selectedCustomer.id,
      assignedToId: selectedTechnician?.id || undefined,
      title: titleText,
      description: description.trim() || 'Ticket created from intake form.',
      priority: priority,
      status: 'RECEIVED',
      itemCategory: catalogResolution.itemCategory || undefined,
      brand: catalogResolution.brand || undefined,
      model: catalogResolution.model || undefined,
      globalCatalogItemId: catalogResolution.globalCatalogItemId || undefined,
      tenantCatalogItemId: catalogResolution.tenantCatalogItemId || undefined,
      source: catalogResolution.source,
      serialNumber: serialNumber || undefined,
      reportedIssue: reportedIssue || undefined,
      itemCondition: itemCondition || undefined,
      accessories: accessoriesText.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
      advanceAmount: advanceReceived
        ? isSplitPayment
          ? (parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0) + (parseFloat(cardAmount) || 0)
          : advanceAmount ? parseFloat(advanceAmount) : undefined
        : undefined,
      paymentMethod: advanceReceived ? (isSplitPayment ? 'CASH' : paymentMethod) : undefined,
      advanceNotes: advanceReceived
        ? isSplitPayment
          ? `Split breakdown: Cash ₹${parseFloat(cashAmount) || 0}, UPI ₹${parseFloat(upiAmount) || 0}, Card ₹${parseFloat(cardAmount) || 0}${advanceNotes ? ` | ${advanceNotes}` : ''}`
          : advanceNotes || undefined
        : undefined,
      attachmentIds: [...photoAttachmentIds, ...videoAttachmentIds],
      attachments: attachments
        .filter((a) => a.url)
        .map((a) => ({
          id: crypto.randomUUID(),
          url: a.url!,
          type: a.type,
          stage: 'intake',
          uploadedAt: new Date().toISOString(),
          fileName: a.file.name,
        })),
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
    <div className="min-h-screen bg-[#f4f7fb] pb-24 text-[#1e293b] -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
      {/* ──── TOP BANNER HEADER (TOUCHES NAVBAR WITH 0 GAP) ── */}
      <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-30 bg-gradient-to-r from-[#dbeafe] via-[#e2e8f0] to-[#f1f5f9] border-b border-[#cbd5e1] px-6 py-4 shadow-sm transition-all backdrop-blur-md">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
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
            <h1 className="text-xl font-extrabold text-[#1e293b] tracking-tight">
              Create Repair Ticket
            </h1>
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
              disabled={createMutation.isPending}
              onClick={handleSubmit}
              className="px-6 py-2 rounded-full bg-[#116dff] hover:bg-[#0d5fd9] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
              {createMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6 pt-6 px-4 sm:px-6 lg:px-8">

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2 shadow-sm animate-in fade-in">
            <AlertCircle className="size-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* ── SECTION 1 CARD: CUSTOMER & DEVICE ──────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#162d3d]">
              Customer &amp; Device
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Select Customer */}
            <div ref={pickerRef} className="relative">
              <label className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                Select Customer <span className="text-[#ef4444]">*</span>
              </label>
              <div
                className={`flex h-11 items-center rounded-xl border bg-white transition ${isPickerOpen ? 'border-[#116dff] ring-2 ring-[#116dff]/15' : 'border-[#cbd5e1]'
                  }`}
              >
                <Search className="ml-3.5 size-4 shrink-0 text-[#94a3b8]" />
                <input
                  value={query}
                  onFocus={() => setIsPickerOpen(true)}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedCustomer(null);
                    setIsPickerOpen(true);
                  }}
                  placeholder="Search customer name or phone..."
                  className="min-w-0 flex-1 bg-transparent px-3 text-xs text-[#1e293b] outline-none placeholder:text-[#94a3b8]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setSelectedCustomer(null);
                    }}
                    className="mr-3 p-1 text-[#94a3b8] hover:text-[#1e293b]"
                  >
                    <X className="size-4" />
                  </button>
                )}
                {!query && <ChevronDown className="mr-3.5 size-4 text-[#94a3b8]" />}
              </div>

              {selectedCustomer && !isPickerOpen && (
                <div className="mt-2 p-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-xs text-[#166534] flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#16a34a] shrink-0" />
                  <span>
                    <strong>Selected Customer:</strong> {selectedCustomer.name} ({selectedCustomer.phone || 'No phone'})
                  </span>
                </div>
              )}

              {/* Customer Dropdown */}
              {isPickerOpen && (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-[#cbd5e1] bg-white shadow-xl">
                  <div className="max-h-56 overflow-y-auto p-2">
                    {isFetching && (
                      <div className="flex items-center gap-2 px-3 py-4 text-xs text-[#64748b]">
                        <Loader2 className="size-4 animate-spin" /> Searching customers...
                      </div>
                    )}
                    {!isFetching && !query && (
                      <div className="px-3 py-4 text-xs text-[#64748b]">Start typing a name or phone number.</div>
                    )}
                    {!isFetching && query && customers.length > 0 && (
                      <>
                        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold text-[#64748b]">Matching customers</p>
                        {customers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => chooseCustomer(customer)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#f8fafc]"
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#116dff]/10 text-xs font-bold text-[#116dff]">
                              {customer.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-[#1e293b]">
                                {customer.name}
                              </span>
                              <span className="block truncate text-[11px] text-[#64748b]">
                                {customer.phone || 'No phone number'}
                                {customer.email ? ` • ${customer.email}` : ''}
                              </span>
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                    {!isFetching && query && customers.length === 0 && (
                      <div className="px-3 py-3 text-xs text-[#64748b]">No matching customer found.</div>
                    )}
                  </div>
                  {query && !isFetching && customers.length === 0 && (
                    <div className="border-t border-[#cbd5e1] px-3 py-3">
                      <button
                        type="button"
                        onClick={handleOpenAddCustomer}
                        className="flex items-center gap-3 text-left w-full cursor-pointer group"
                      >
                        <span className="flex size-8 items-center justify-center rounded-full bg-[#116dff]/10 text-[#116dff] group-hover:bg-[#116dff] group-hover:text-white transition">
                          <UserPlus className="size-4" />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold text-[#116dff]">Add new customer</span>
                          <span className="block text-[11px] text-[#64748b]">Create customer profile</span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Device / Model Search (1 Column) */}
            <div>
              <ItemModelSearch
                value={catalogResolution.model}
                onChange={setCatalogResolution}
                required
              />
            </div>

            {/* Serial Number / IMEI / VIN (1 Column) */}
            <div>
              <label htmlFor="serial-number" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                Serial Number / IMEI / VIN
              </label>
              <input
                id="serial-number"
                value={serialNumber}
                onChange={(event) => setSerialNumber(event.target.value)}
                placeholder="Enter serial number or IMEI"
                className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-xs text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15"
              />
            </div>

            {/* Assign Technician */}
            <div ref={technicianPickerRef} className="relative">
              <label className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                Assign Technician <span className="text-[#94a3b8] font-normal">(optional)</span>
              </label>
              <div
                className={`flex h-11 items-center rounded-xl border bg-white transition ${isTechnicianPickerOpen ? 'border-[#116dff] ring-2 ring-[#116dff]/15' : 'border-[#cbd5e1]'
                  }`}
              >
                <Search className="ml-3.5 size-4 shrink-0 text-[#94a3b8]" />
                <input
                  value={technicianQuery}
                  onFocus={() => setIsTechnicianPickerOpen(true)}
                  onChange={(event) => {
                    setTechnicianQuery(event.target.value);
                    setSelectedTechnician(null);
                    setIsTechnicianPickerOpen(true);
                  }}
                  placeholder="Search technician name or phone..."
                  className="min-w-0 flex-1 bg-transparent px-3 text-xs text-[#1e293b] outline-none placeholder:text-[#94a3b8]"
                />
                {technicianQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setTechnicianQuery('');
                      setSelectedTechnician(null);
                    }}
                    className="mr-3 p-1 text-[#94a3b8] hover:text-[#1e293b]"
                  >
                    <X className="size-4" />
                  </button>
                )}
                {!technicianQuery && <ChevronDown className="mr-3.5 size-4 text-[#94a3b8]" />}
              </div>
              {isTechnicianPickerOpen && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[#cbd5e1] bg-white shadow-lg">
                  <div className="max-h-56 overflow-y-auto p-2">
                    {matchingTechnicians.length > 0 ? (
                      matchingTechnicians.map((technician) => (
                        <button
                          key={technician.id}
                          type="button"
                          onClick={() => {
                            setSelectedTechnician(technician);
                            setTechnicianQuery(technician.name);
                            setIsTechnicianPickerOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#f8fafc]"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#116dff]/10 text-xs font-bold text-[#116dff]">
                            {technician.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-[#1e293b]">
                              {technician.name}
                            </span>
                            <span className="block truncate text-[11px] text-[#64748b]">
                              {technician.phone || 'No phone number'}
                            </span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-xs text-[#64748b]">No matching technician found.</div>
                    )}
                  </div>
                  <div className="border-t border-[#cbd5e1] px-3 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTechnicianPickerOpen(false);
                        setIsStaffModalOpen(true);
                      }}
                      className="flex items-center gap-3 text-left"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-[#116dff]/10 text-[#116dff]">
                        <UserPlus className="size-4" />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold text-[#116dff]">Add new staff</span>
                        <span className="block text-[11px] text-[#64748b]">Register a technician</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 2 CARD: TICKET DETAILS ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#162d3d]">
              Ticket Details
            </h2>
          </div>

          <div className="space-y-6">
            {/* Reported Problem / Issue */}
            <div>
              <label htmlFor="reported-issue" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                Reported Problem / Issue <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                id="reported-issue"
                value={reportedIssue}
                onChange={(event) => setReportedIssue(event.target.value)}
                placeholder="e.g. Screen is not responding, battery drains fast, device won't turn on..."
                rows={3}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white p-3.5 text-xs text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 resize-none"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                Description <span className="text-[#94a3b8] font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Enter detailed description of the device or diagnostic plan..."
                rows={3}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white p-3.5 text-xs text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 resize-none"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="internal-notes" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                Additional Notes <span className="text-[#94a3b8] font-normal">(optional)</span>
              </label>
              <textarea
                id="internal-notes"
                value={internalNotes}
                onChange={(event) => setInternalNotes(event.target.value)}
                placeholder="Enter internal staff notes, discount info, VIP details, etc..."
                rows={2}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white p-3.5 text-xs text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 resize-none"
              />
            </div>

            {/* Priority (Normal: #8A4B08, Urgent: #C62828) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                Priority <span className="text-[#ef4444]">*</span>
              </label>
              <div className="flex gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setPriority('NORMAL')}
                  className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${priority === 'NORMAL'
                    ? 'bg-[#8A4B08]/10 border-[#8A4B08] text-[#8A4B08]'
                    : 'bg-white border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
                    }`}
                >
                  <Activity className="size-4" />
                  NORMAL
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('URGENT')}
                  className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${priority === 'URGENT'
                    ? 'bg-[#C62828]/10 border-[#C62828] text-[#C62828]'
                    : 'bg-white border-[#cbd5e1] text-[#64748b] hover:bg-[#f8fafc]'
                    }`}
                >
                  <AlertCircle className="size-4" />
                  URGENT
                </button>
              </div>
            </div>

            {/* Single Clean Date Input */}
            <div>
              <label htmlFor="service-date" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                Date <span className="text-[#ef4444]">*</span>
              </label>
              <input
                id="service-date"
                type="date"
                value={serviceDate}
                onChange={(event) => setServiceDate(event.target.value)}
                className="h-11 w-full max-w-md rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-xs text-[#1e293b] outline-none transition focus:border-[#116dff] [color-scheme:light]"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 3 CARD: INTAKE & CONDITION ──────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#162d3d]">
              Intake &amp; Condition
            </h2>

          </div>

          <div className="space-y-6">
            {/* Top Row: Side-by-side Textareas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Physical Condition on Intake */}
              <div>
                <label htmlFor="item-condition" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                  Physical Condition on Intake
                </label>
                <div className="relative">
                  <textarea
                    id="item-condition"
                    value={itemCondition}
                    maxLength={300}
                    onChange={(event) => setItemCondition(event.target.value)}
                    placeholder="e.g. Screen cracked, minor scratches on back, body dent, back glass shattered..."
                    rows={4}
                    className="w-full rounded-2xl border border-[#cbd5e1] bg-white p-3.5 pb-7 text-xs text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 resize-none"
                  />
                  <span className="absolute bottom-3 right-3 text-[11px] text-[#94a3b8]">
                    {itemCondition.length}/300
                  </span>
                </div>
              </div>

              {/* Accessories Received */}
              <div>
                <label htmlFor="accessories-text" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                  Accessories Received
                </label>
                <div className="relative">
                  <textarea
                    id="accessories-text"
                    value={accessoriesText}
                    maxLength={200}
                    onChange={(event) => setAccessoriesText(event.target.value)}
                    placeholder="e.g. Charger, USB Cable, SIM Tray, Protective Case..."
                    rows={4}
                    className="w-full rounded-2xl border border-[#cbd5e1] bg-white p-3.5 pb-7 text-xs text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15 resize-none"
                  />
                  <span className="absolute bottom-3 right-3 text-[11px] text-[#94a3b8]">
                    {accessoriesText.length}/200
                  </span>
                </div>
              </div>
            </div>

            {/* Unified Media Upload Card */}
            <div className="bg-white rounded-2xl overflow-hidden p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#e2e8f0]">
                {/* Images Column */}
                <div className="md:pr-6 pb-6 md:pb-0">
                  <AttachmentUploader
                    entityType="TICKET"
                    entityId="new"
                    category="TICKET_INTAKE_PHOTO"
                    accept="image/jpeg,image/png,image/webp"
                    maxFiles={4}
                    label="Images"
                    value={photoAttachmentIds}
                    onChange={setPhotoAttachmentIds}
                  />
                </div>

                {/* Videos Column */}
                <div className="md:pl-6 pt-6 md:pt-0">
                  <AttachmentUploader
                    entityType="TICKET"
                    entityId="new"
                    category="TICKET_INTAKE_VIDEO"
                    accept="video/mp4,video/quicktime,video/webm"
                    maxFiles={2}
                    label="Videos"
                    value={videoAttachmentIds}
                    onChange={setVideoAttachmentIds}
                  />
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* ── SECTION 4 CARD: PAYMENT / INTAKE ────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#162d3d]">
              Payment / Intake
            </h2>
          </div>

          <div className="space-y-6">
            {/* Advance Received? */}
            <div>
              <h3 className="text-xs font-bold text-[#1e293b]">Advance Received?</h3>
              <p className="text-xs text-[#64748b] mt-0.5 mb-3">
                Let us know if you have received any advance payment for this repair.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdvanceReceived(false)}
                  className={`h-11 px-6 rounded-xl border text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-all ${
                    !advanceReceived
                      ? 'bg-[#eff6ff] border-[#116dff] text-[#1e293b]'
                      : 'bg-white border-[#e2e8f0] text-[#1e293b] hover:bg-slate-50'
                  }`}
                >
                  <span className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                    !advanceReceived ? 'border-[#116dff] bg-white' : 'border-[#cbd5e1] bg-white'
                  }`}>
                    {!advanceReceived && <span className="size-2 rounded-full bg-[#116dff]" />}
                  </span>
                  No
                </button>

                <button
                  type="button"
                  onClick={() => setAdvanceReceived(true)}
                  className={`h-11 px-6 rounded-xl border text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-all ${
                    advanceReceived
                      ? 'bg-[#eff6ff] border-[#116dff] text-[#1e293b]'
                      : 'bg-white border-[#e2e8f0] text-[#1e293b] hover:bg-slate-50'
                  }`}
                >
                  <span className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                    advanceReceived ? 'border-[#116dff] bg-white' : 'border-[#cbd5e1] bg-white'
                  }`}>
                    {advanceReceived && <span className="size-2 rounded-full bg-[#116dff]" />}
                  </span>
                  Yes
                </button>
              </div>
            </div>

            {/* Expanded Advance Fields */}
            {advanceReceived && (
              <div className="space-y-4 p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] animate-in fade-in">
                {/* Split Payment Checkbox Toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSplitPayment}
                    onChange={(e) => setIsSplitPayment(e.target.checked)}
                    className="size-4 accent-[#116dff] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#1e293b]">Split Payment (Cash / UPI / Card)</span>
                </label>

                {isSplitPayment ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="cash-amt" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                          Cash Amount (₹)
                        </label>
                        <input
                          id="cash-amt"
                          type="number"
                          min="0"
                          step="0.01"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          placeholder="₹ 0.00"
                          className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-xs text-[#1e293b] outline-none focus:border-[#116dff]"
                        />
                      </div>

                      <div>
                        <label htmlFor="upi-amt" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                          UPI / QR Amount (₹)
                        </label>
                        <input
                          id="upi-amt"
                          type="number"
                          min="0"
                          step="0.01"
                          value={upiAmount}
                          onChange={(e) => setUpiAmount(e.target.value)}
                          placeholder="₹ 0.00"
                          className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-xs text-[#1e293b] outline-none focus:border-[#116dff]"
                        />
                      </div>

                      <div>
                        <label htmlFor="card-amt" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                          Card Amount (₹)
                        </label>
                        <input
                          id="card-amt"
                          type="number"
                          min="0"
                          step="0.01"
                          value={cardAmount}
                          onChange={(e) => setCardAmount(e.target.value)}
                          placeholder="₹ 0.00"
                          className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-xs text-[#1e293b] outline-none focus:border-[#116dff]"
                        />
                      </div>
                    </div>

                    {/* Split Total & Notes Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="bg-white rounded-xl border border-[#cbd5e1] px-4 py-2.5 flex justify-between items-center h-11">
                        <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Split Total</span>
                        <span className="font-mono font-bold text-sm text-[#116dff]">
                          ₹{((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0) + (parseFloat(cardAmount) || 0)).toFixed(2)}
                        </span>
                      </div>

                      <div className="md:col-span-2">
                        <input
                          id="advance-notes-split"
                          value={advanceNotes}
                          onChange={(e) => setAdvanceNotes(e.target.value)}
                          placeholder="Reference / Notes (e.g. Deposit split details)"
                          className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-xs text-[#1e293b] outline-none focus:border-[#116dff]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="advance-amount-val" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                        Advance Amount (₹) <span className="text-[#ef4444]">*</span>
                      </label>
                      <input
                        id="advance-amount-val"
                        type="number"
                        min="0"
                        value={advanceAmount}
                        onChange={(event) => setAdvanceAmount(event.target.value)}
                        placeholder="₹ 2,000"
                        className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-xs text-[#1e293b] outline-none focus:border-[#116dff]"
                      />
                    </div>

                    <div>
                      <label htmlFor="payment-method-val" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                        Payment Method <span className="text-[#ef4444]">*</span>
                      </label>
                      <select
                        id="payment-method-val"
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value as any)}
                        className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-xs text-[#1e293b] outline-none focus:border-[#116dff] cursor-pointer"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="advance-notes-val" className="mb-1.5 block text-xs font-semibold text-[#1e293b]">
                        Reference / Notes
                      </label>
                      <input
                        id="advance-notes-val"
                        value={advanceNotes}
                        onChange={(event) => setAdvanceNotes(event.target.value)}
                        placeholder="e.g. Diagnostic fee deposit"
                        className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 text-xs text-[#1e293b] outline-none focus:border-[#116dff]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM FOOTER ACTION BUTTONS ──────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#cbd5e1]">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 rounded-full bg-white border border-[#cbd5e1] text-xs font-semibold text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={handleSubmit}
            className="px-8 py-2.5 rounded-full bg-[#116dff] hover:bg-[#0d5fd9] text-white text-xs font-bold shadow-md shadow-[#116dff]/15 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {createMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Customer & Staff Modals */}
      <CreateCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerToEdit={null}
        initialData={customerModalInitialData}
        onCreated={handleCustomerCreated}
      />
      <CreateEmployeeModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        employeeToEdit={null}
        onCreated={handleStaffCreated}
      />
    </div>
  );
}
