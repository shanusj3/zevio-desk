import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, Loader2, Mail, MapPin, X } from 'lucide-react';
import { Customer } from '../lib/api';
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '../hooks/useCustomersQuery';
import { useAppStore } from '../store/useAppStore';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit: Customer | null;
  onCreated?: (customer: Customer) => void;
}

const emptyForm = {
  name: '', email: '', phone: '', whatsappId: '', address: '',
  customerType: 'WALK_IN' as Customer['customerType'], notes: '',
};

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({ isOpen, onClose, customerToEdit, onCreated }) => {
  const { showToast } = useAppStore();
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(customerToEdit ? {
      name: customerToEdit.name, email: customerToEdit.email || '', phone: customerToEdit.phone || '',
      whatsappId: customerToEdit.whatsappId || '', address: customerToEdit.address || '',
      customerType: customerToEdit.customerType, notes: customerToEdit.notes || '',
    } : emptyForm);
    setError(null);
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const changeField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) return setError('Full name is required');
    if (!formData.phone.trim() && !formData.email.trim()) return setError('Add a phone number or email address');
    const payload = {
      name: formData.name.trim(), email: formData.email.trim() || null, phone: formData.phone.trim() || null,
      whatsappId: formData.whatsappId.trim() || null, address: formData.address.trim() || null,
      customerType: formData.customerType, notes: formData.notes.trim() || null,
    };
    try {
      if (customerToEdit) {
        const savedCustomer = await updateMutation.mutateAsync({ id: customerToEdit.id, data: payload });
        showToast('Customer profile updated', 'success');
        onCreated?.(savedCustomer);
      } else {
        const savedCustomer = await createMutation.mutateAsync(payload);
        showToast('Customer profile created', 'success');
        onCreated?.(savedCustomer);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const labelStyle = 'block text-sm font-medium text-[#c8cad3]';
  const inputStyle = 'h-[58px] w-full rounded-xl border border-white/[0.035] bg-[#303748] px-5 text-sm text-white placeholder:text-[#a4a8b5] outline-none transition focus:border-[#d8ab4d] focus:ring-2 focus:ring-[#d8ab4d]/15';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-6">
      <button aria-label="Close dialog" className="fixed inset-0 cursor-default bg-black/80 backdrop-blur-[2px]" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" className="relative z-10 flex max-h-[calc(100dvh-1rem)] w-full max-w-[850px] flex-col overflow-hidden rounded-lg sm:max-h-[calc(100dvh-3rem)] border border-white/[0.06] bg-[linear-gradient(135deg,#232a3a_0%,#1b212e_100%)] shadow-2xl shadow-black/60">
        <div className="flex shrink-0 items-center justify-between px-5 pt-5 sm:px-9 sm:pt-7">
          <h2 id="customer-dialog-title" className="text-[22px] font-semibold tracking-tight text-white">{customerToEdit ? 'Edit customer' : 'Add customer'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-[#aeb3c0] transition hover:bg-white/10 hover:text-white"><X className="size-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-9 sm:py-6">
          {error && <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200"><AlertCircle className="size-4 shrink-0" />{error}</div>}
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
            <div className="space-y-3 md:col-span-2">
              <label htmlFor="customer-name" className={labelStyle}>Full Name <span className="text-[#e5bb5e]">*</span></label>
              <input id="customer-name" value={formData.name} onChange={(e) => changeField('name', e.target.value)} placeholder="Enter full name" className={inputStyle} autoFocus />
            </div>
            <div className="space-y-3">
              <label htmlFor="customer-phone" className={labelStyle}>Phone Number <span className="text-[#e5bb5e]">*</span></label>
              <div className="flex h-[58px] overflow-hidden rounded-xl border border-white/[0.035] bg-[#303748] focus-within:border-[#d8ab4d] focus-within:ring-2 focus-within:ring-[#d8ab4d]/15"><span className="flex w-[68px] items-center justify-center border-r border-black/10 text-sm font-semibold text-white">+91</span><input id="customer-phone" value={formData.phone} onChange={(e) => changeField('phone', e.target.value)} placeholder="Enter phone number" className="min-w-0 flex-1 bg-transparent px-5 text-sm text-white placeholder:text-[#a4a8b5] outline-none" inputMode="tel" /></div>
            </div>
            <div className="space-y-3">
              <label htmlFor="customer-alternate-phone" className={labelStyle}>Additional Mobile Number</label>
              <div className="flex h-[58px] overflow-hidden rounded-xl border border-white/[0.035] bg-[#303748] focus-within:border-[#d8ab4d] focus-within:ring-2 focus-within:ring-[#d8ab4d]/15"><span className="flex w-[68px] items-center justify-center border-r border-black/10 text-sm font-semibold text-white">+91</span><input id="customer-alternate-phone" value={formData.whatsappId} onChange={(e) => changeField('whatsappId', e.target.value)} placeholder="Enter additional mobile number" className="min-w-0 flex-1 bg-transparent px-5 text-sm text-white placeholder:text-[#a4a8b5] outline-none" inputMode="tel" /></div>
            </div>
            <div className="space-y-3">
              <label htmlFor="customer-email" className={labelStyle}>Email Address <span className="text-[#a4a8b5]">(optional)</span></label>
              <div className="relative"><Mail className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#c4c8d1]" /><input id="customer-email" type="email" value={formData.email} onChange={(e) => changeField('email', e.target.value)} placeholder="Enter email address" className={`${inputStyle} pl-14`} /></div>
            </div>
            <div className="space-y-3">
              <label htmlFor="customer-type" className={labelStyle}>Customer Type</label>
              <div className="relative"><select id="customer-type" value={formData.customerType} onChange={(e) => changeField('customerType', e.target.value)} className={`${inputStyle} appearance-none pr-12`}><option value="WALK_IN">Walk-in Customer</option><option value="RETURNING">Returning Customer</option><option value="BUSINESS">Business Account</option></select><ChevronDown className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[#e5bb5e]" /></div>
              <p className="text-xs leading-5 text-[#a4a8b5]">Used to group customers in the customer list. Leave the default for regular walk-in customers.</p>
            </div>
            <div className="space-y-3">
              <label htmlFor="customer-notes" className={labelStyle}>Internal Notes <span className="text-[#a4a8b5]">(optional)</span></label>
              <textarea id="customer-notes" value={formData.notes} onChange={(e) => changeField('notes', e.target.value)} placeholder="Add notes for your team" className={`${inputStyle} h-[96px] resize-y py-4`} />
            </div>
            <div className="space-y-3">
              <label htmlFor="customer-location" className={labelStyle}>Location <span className="text-[#a4a8b5]">(optional)</span></label>
              <div className="relative"><MapPin className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#c4c8d1]" /><input id="customer-location" value={formData.address} onChange={(e) => changeField('address', e.target.value)} placeholder="Enter location" className={`${inputStyle} pl-14`} /></div>
            </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/[0.06] bg-[#1b212e] px-5 py-5 sm:px-9 sm:py-6">
            <button type="button" onClick={onClose} className="h-[54px] min-w-[130px] rounded-xl border border-[#d3a944] px-7 text-sm font-semibold text-[#e5bb5e] transition hover:bg-[#d3a944]/10">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex h-[54px] min-w-[162px] items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#f0cd77_0%,#d9a743_100%)] px-7 text-sm font-bold text-[#17191e] shadow-lg shadow-[#d9a743]/10 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <Loader2 className="size-4 animate-spin" />}{customerToEdit ? 'Save Changes' : 'Submit'}</button>
          </div>
        </form>
      </section>
    </div>
  );
};




