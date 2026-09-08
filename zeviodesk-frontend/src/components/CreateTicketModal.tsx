import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Tag,
  User,
  Cpu,
  DollarSign,
  Upload,
  Image,
  Video,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { CreateTicketPayload, ticketsApi } from '../lib/api';
import { useCreateTicketMutation } from '../hooks/useTicketsQuery';
import { useCustomersQuery } from '../hooks/useCustomersQuery';
import { useUsersQuery } from '../hooks/useUsersQuery';
import { useAppStore } from '../store/useAppStore';
import { ItemModelSearch, CatalogResolution } from './ItemModelSearch';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const STEPS = ['Customer & Device', 'Issue & Assignment', 'Financials'];


type AttachmentFile = {
  file: File;
  preview: string;
  type: 'photo' | 'video';
  uploading: boolean;
  uploaded: boolean;
  fileUrl?: string;
  error?: string;
};

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useAppStore();
  const createMutation = useCreateTicketMutation();
  const { data: customers = [] } = useCustomersQuery();
  const { data: staff = [] } = useUsersQuery(true);

  const technicians = staff.filter((u) =>
    ['TECHNICIAN', 'ADVISOR', 'MANAGER', 'TENANT_ADMIN'].includes(u.role)
  );

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [tempTicketId] = useState(() => crypto.randomUUID());
  const [catalogResolution, setCatalogResolution] = useState<CatalogResolution>({ model: '', itemCategory: '', brand: '', globalCatalogItemId: null, tenantCatalogItemId: null, source: 'CUSTOM' });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    // Step 1 - Customer & Device
    customerId: '',
    serialNumber: '',
    itemCondition: '',
    accessories: '',
    // Step 2 - Issue & Assignment
    title: '',
    reportedIssue: '',
    description: '',
    internalNotes: '',
    priority: 'NORMAL' as 'NORMAL' | 'URGENT',
    assignedToId: '',
    estimatedCompletionDate: '',
    // Step 3 - Financials
    estimatedCost: '',
    advanceDeposit: '',
    paymentStatus: 'UNPAID' as 'UNPAID' | 'PARTIAL' | 'PAID',
  });

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setError(null);
      setAttachments([]);
      setCatalogResolution({ model: '', itemCategory: '', brand: '', globalCatalogItemId: null, tenantCatalogItemId: null, source: 'CUSTOM' });
      setFormData({
        customerId: '',
        serialNumber: '',
        itemCondition: '',
        accessories: '',
        title: '',
        reportedIssue: '',
        description: '',
        internalNotes: '',
        priority: 'NORMAL',
        assignedToId: '',
        estimatedCompletionDate: '',
        estimatedCost: '',
        advanceDeposit: '',
        paymentStatus: 'UNPAID',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const photoCount = attachments.filter((a) => a.type === 'photo').length;
  const videoCount = attachments.filter((a) => a.type === 'video').length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxPhotos = 12;
    const maxVideos = 2;
    const maxPhotoSize = 10 * 1024 * 1024;
    const maxVideoSize = 50 * 1024 * 1024;

    for (const file of files) {
      if (type === 'photo' && photoCount >= maxPhotos) {
        showToast('Maximum 12 photos per ticket', 'warning');
        break;
      }
      if (type === 'video' && videoCount >= maxVideos) {
        showToast('Maximum 2 videos per ticket', 'warning');
        break;
      }
      if (type === 'photo' && file.size > maxPhotoSize) {
        showToast(`Photo too large: ${file.name} (max 10MB)`, 'warning');
        continue;
      }
      if (type === 'video' && file.size > maxVideoSize) {
        showToast(`Video too large: ${file.name} (max 50MB)`, 'warning');
        continue;
      }

      const preview = URL.createObjectURL(file);
      const entry: AttachmentFile = { file, preview, type, uploading: true, uploaded: false };
      setAttachments((prev) => [...prev, entry]);

      // Upload to S3
      try {
        const { url, fields, fileUrl } = await ticketsApi.getAttachmentPresign(
          tempTicketId,
          file.type,
          type
        );
        await ticketsApi.uploadAttachment(url, fields, file);
        setAttachments((prev) =>
          prev.map((a) =>
            a.preview === preview ? { ...a, uploading: false, uploaded: true, fileUrl } : a
          )
        );
      } catch {
        setAttachments((prev) =>
          prev.map((a) =>
            a.preview === preview
              ? { ...a, uploading: false, uploaded: false, error: 'Upload failed' }
              : a
          )
        );
      }
    }

    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (preview: string) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.preview === preview);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((a) => a.preview !== preview);
    });
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!formData.customerId) { setError('Please select a customer'); return false; }
      if (!catalogResolution.model.trim()) { setError('Please enter an item or model name'); return false; }
      if (!catalogResolution.itemCategory) { setError('This item is not in the catalog. Please select its category.'); return false; }
    }
    if (step === 1) {
      if (!formData.title.trim()) { setError('Ticket title / job description is required'); return false; }
    }
    if (step === 2) {
      if (formData.paymentStatus === 'PARTIAL' || formData.paymentStatus === 'PAID') {
        const dep = parseFloat(formData.advanceDeposit);
        if (!formData.advanceDeposit.trim() || isNaN(dep) || dep <= 0) {
          setError('Payment intake is selected. Please enter a valid advance deposit / payment amount before saving.');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    setError(null);
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    const payload: CreateTicketPayload = {
      id: tempTicketId,
      customerId: formData.customerId,
      title: formData.title || `${catalogResolution.brand} ${catalogResolution.model} Repair`.trim(),
      description: formData.description || formData.itemCondition || '',
      priority: formData.priority,
      assignedToId: formData.assignedToId || undefined,
      itemCategory: catalogResolution.itemCategory || undefined,
      brand: catalogResolution.brand || undefined,
      model: catalogResolution.model || undefined,
      serialNumber: formData.serialNumber || undefined,
      itemCondition: formData.itemCondition || undefined,
      accessories: formData.accessories || undefined,
      estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
      status: 'RECEIVED',
    };

    try {
      await createMutation.mutateAsync(payload);
      showToast('Ticket created successfully! 🎉', 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-2xl shadow-2xl z-10 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#1e293b]">New Repair Ticket</h2>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              Step {step + 1} of {STEPS.length}: <span className="text-[#116dff] font-semibold">{STEPS[step]}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#64748B] hover:text-[#1e293b] hover:bg-[#e2e8f0] rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-0.5 bg-[#e2e8f0] shrink-0">
          <div
            className="h-full bg-[#116dff] transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-6 px-6 pt-4 pb-3 shrink-0">
          {STEPS.map((label, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  idx < step
                    ? 'bg-[#116dff] text-white'
                    : idx === step
                    ? 'bg-[#116dff]/10 border border-[#116dff] text-[#116dff]'
                    : 'bg-[#f1f5f9] text-[#64748B]'
                }`}
              >
                {idx < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] font-semibold hidden sm:block ${
                  idx === step ? 'text-[#1e293b]' : 'text-[#64748B]'
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {/* ── STEP 0: Customer & Device ─────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4 pt-2">
              {/* Customer Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#334155] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#116dff]" />
                  Customer <span className="text-[#116dff]">*</span>
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleChange('customerId', e.target.value)}
                  className="w-full h-11 bg-white border border-[#cbd5e1] focus:border-[#116dff] rounded-xl px-3.5 text-xs text-[#1e293b] focus:outline-none"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` · ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item / Model Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#334155] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#116dff]" />
                  Item / Model <span className="text-[#116dff]">*</span>
                </label>
                <ItemModelSearch
                  value={catalogResolution.model}
                  onChange={setCatalogResolution}
                  required
                  labelStyle="hidden"
                />
              </div>

              {/* Serial / IMEI */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#334155]">Serial Number / IMEI / VIN</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  placeholder="Scan or type the device identifier"
                  className="w-full h-11 bg-white border border-[#cbd5e1] focus:border-[#116dff] rounded-xl px-3.5 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none"
                />
              </div>

              {/* Physical Condition */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#334155]">Physical Condition on Intake</label>
                <textarea
                  value={formData.itemCondition}
                  onChange={(e) => handleChange('itemCondition', e.target.value)}
                  placeholder="Document scratches, cracks, dents, liquid damage — important for dispute protection"
                  rows={2}
                  className="w-full bg-white border border-[#cbd5e1] focus:border-[#116dff] rounded-xl p-3.5 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none resize-none"
                />
              </div>

              {/* Accessories */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#334155]">Accessories Received</label>
                <input
                  type="text"
                  value={formData.accessories}
                  onChange={(e) => handleChange('accessories', e.target.value)}
                  placeholder="e.g. Charger, case, remote, stylus..."
                  className="w-full h-11 bg-white border border-[#cbd5e1] focus:border-[#116dff] rounded-xl px-3.5 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none"
                />
              </div>

              {/* Intake Photo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#334155] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#116dff]" />
                    Intake Photos &amp; Videos
                  </span>
                  <span className="text-[10px] text-[#64748B]">{photoCount}/12 photos · {videoCount}/2 videos</span>
                </label>

                <div className="bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-xl p-4">
                  <div className="flex gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoCount >= 12}
                      className="flex-1 flex items-center justify-center gap-2 h-10 bg-white border border-[#cbd5e1] text-[#334155] hover:text-[#116dff] hover:border-[#116dff] rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Image className="w-3.5 h-3.5" />
                      Add Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={videoCount >= 2}
                      className="flex-1 flex items-center justify-center gap-2 h-10 bg-white border border-[#cbd5e1] text-[#334155] hover:text-[#116dff] hover:border-[#116dff] rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Add Videos
                    </button>
                  </div>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'photo')}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'video')}
                  />

                  {attachments.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {attachments.map((att, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[#cbd5e1] group bg-white">
                          {att.type === 'photo' ? (
                            <img
                              src={att.preview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={att.preview}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {/* Upload overlay */}
                          {att.uploading && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-[#116dff] animate-spin" />
                            </div>
                          )}
                          {att.uploaded && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-[#059669] rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {att.error && (
                            <div className="absolute inset-0 bg-red-100/80 flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.preview)}
                            className="absolute bottom-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {attachments.length === 0 && (
                    <p className="text-center text-[10px] text-[#64748B]">
                      Recommended: 3–5 photos for small devices, 5–7 for medium, 8–12 for large items
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Issue & Assignment ────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 pt-2">
              {/* Ticket Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#334155] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#116dff]" />
                  Ticket Title / Job Description <span className="text-[#116dff]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g. Screen replacement, Battery swap, Motherboard repair"
                  className="w-full h-11 bg-white border border-[#cbd5e1] focus:border-[#116dff] rounded-xl px-3.5 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none"
                />
              </div>

              {/* Customer-Reported Issue */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#334155]">Customer-Reported Issue</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe what the customer says is wrong with the device..."
                  rows={3}
                  className="w-full bg-white border border-[#cbd5e1] focus:border-[#116dff] rounded-xl p-3.5 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#334155]">Priority</label>
                  <div className="flex gap-2">
                    {(['NORMAL', 'URGENT'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleChange('priority', p)}
                        className={`flex-1 h-10 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          formData.priority === p
                            ? p === 'URGENT'
                              ? 'bg-red-50 border-red-500 text-red-700'
                              : 'bg-[#116dff]/10 border-[#116dff] text-[#116dff]'
                            : 'bg-white border-[#cbd5e1] text-[#64748B] hover:border-[#94a3b8]'
                        }`}
                      >
                        {p === 'NORMAL' ? 'Normal' : 'Urgent'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assigned Technician */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#334155]">Assigned Technician</label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => handleChange('assignedToId', e.target.value)}
                    className="w-full h-11 bg-white border border-[#cbd5e1] focus:border-[#116dff] rounded-xl px-3.5 text-xs text-[#1e293b] focus:outline-none"
                  >
                    <option value="">-- Unassigned --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role.replace('TENANT_', '')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Estimated Completion Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#334155]">Estimated Completion Date</label>
                <input
                  type="date"
                  value={formData.estimatedCompletionDate}
                  onChange={(e) => handleChange('estimatedCompletionDate', e.target.value)}
                  className="w-full h-11 bg-white border border-[#cbd5e1] focus:border-[#116dff] rounded-xl px-3.5 text-xs text-[#1e293b] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: Financials ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Estimated Cost */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#334155] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#116dff]" />
                    Estimated Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.estimatedCost}
                      onChange={(e) => handleChange('estimatedCost', e.target.value)}
                      placeholder="0.00"
                      className="w-full h-11 bg-white border border-[#cbd5e1] focus:border-[#116dff] rounded-xl pl-7 pr-3.5 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Advance Deposit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#334155]">Advance Deposit</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.advanceDeposit}
                      onChange={(e) => handleChange('advanceDeposit', e.target.value)}
                      placeholder="0.00"
                      className="w-full h-11 bg-white border border-[#cbd5e1] focus:border-[#116dff] rounded-xl pl-7 pr-3.5 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#334155]">Payment Status</label>
                <div className="flex gap-2">
                  {(['UNPAID', 'PARTIAL', 'PAID'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleChange('paymentStatus', status)}
                      className={`flex-1 h-10 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        formData.paymentStatus === status
                          ? status === 'PAID'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : status === 'PARTIAL'
                            ? 'bg-amber-50 border-amber-500 text-amber-700'
                            : 'bg-red-50 border-red-500 text-red-700'
                          : 'bg-white border-[#cbd5e1] text-[#64748B] hover:border-[#94a3b8]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-2.5 mt-2">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Ticket Summary</p>
                {[
                  { label: 'Customer', value: customers.find((c) => c.id === formData.customerId)?.name || '—' },
                  { label: 'Device', value: [catalogResolution.brand, catalogResolution.model].filter(Boolean).join(' ') || '—' },
                  { label: 'Category', value: catalogResolution.itemCategory || '—' },
                  { label: 'Priority', value: formData.priority },
                  { label: 'Assigned To', value: technicians.find((t) => t.id === formData.assignedToId)?.name || 'Unassigned' },
                  { label: 'Photos', value: `${photoCount} attached` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B]">{label}</span>
                    <span className="text-[#1e293b] font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={step === 0 ? onClose : handleBack}
            className="px-4 h-10 border border-[#cbd5e1] bg-white text-[#334155] hover:bg-[#f1f5f9] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {step > 0 && <ChevronLeft className="w-3.5 h-3.5" />}
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 h-10 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-primary/10 cursor-pointer"
            >
              Continue
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 h-10 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-primary/10 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
