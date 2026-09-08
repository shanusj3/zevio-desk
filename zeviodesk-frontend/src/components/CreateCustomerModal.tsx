import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronDown, Loader2, Mail, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '../lib/api';
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '../hooks/useCustomersQuery';
import { useAppStore } from '../store/useAppStore';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit: Customer | null;
  initialData?: { name?: string; phone?: string } | null;
  onCreated?: (customer: Customer) => void;
}

const emptyForm = {
  name: '', email: '', phone: '', whatsappId: '', address: '',
  customerType: 'WALK_IN' as Customer['customerType'], notes: '',
};

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({ isOpen, onClose, customerToEdit, initialData, onCreated }) => {
  const { showToast } = useAppStore();
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Prefix dropdown state
  const [phonePrefix, setPhonePrefix] = useState('+91');
  const [whatsappPrefix, setWhatsappPrefix] = useState('+91');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (customerToEdit) {
      // Parse phone country code
      const phoneMatch = customerToEdit.phone?.match(/^(\+\d+)\s*(.*)$/);
      const parsedPhonePrefix = phoneMatch ? phoneMatch[1] : '+91';
      const parsedPhoneBody = phoneMatch ? phoneMatch[2] : (customerToEdit.phone || '');

      // Parse whatsapp country code
      const whatsappMatch = customerToEdit.whatsappId?.match(/^(\+\d+)\s*(.*)$/);
      const parsedWhatsappPrefix = whatsappMatch ? whatsappMatch[1] : '+91';
      const parsedWhatsappBody = whatsappMatch ? whatsappMatch[2] : (customerToEdit.whatsappId || '');

      setPhonePrefix(parsedPhonePrefix);
      setWhatsappPrefix(parsedWhatsappPrefix);
      setFormData({
        name: customerToEdit.name,
        email: customerToEdit.email || '',
        phone: parsedPhoneBody,
        whatsappId: parsedWhatsappBody,
        address: customerToEdit.address || '',
        customerType: customerToEdit.customerType,
        notes: customerToEdit.notes || '',
      });
    } else {
      setPhonePrefix('+91');
      setWhatsappPrefix('+91');
      setFormData({
        name: initialData?.name || '',
        email: '',
        phone: initialData?.phone || '',
        whatsappId: '',
        address: '',
        customerType: 'WALK_IN',
        notes: '',
      });
    }
    setError(null);
  }, [customerToEdit, initialData, isOpen]);

  const changeField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) return setError('Full name is required');
    if (!formData.phone.trim() && !formData.email.trim()) return setError('Add a phone number or email address');
    
    const fullPhone = formData.phone.trim() ? `${phonePrefix} ${formData.phone.trim()}` : null;
    const fullWhatsapp = formData.whatsappId.trim() ? `${whatsappPrefix} ${formData.whatsappId.trim()}` : null;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: fullPhone,
      whatsappId: fullWhatsapp,
      address: formData.address.trim() || null,
      customerType: formData.customerType,
      notes: formData.notes.trim() || null,
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
  const phoneIsComplete = formData.phone.trim().length >= 10;
  const labelStyle = 'block text-sm font-medium text-[#334155]';
  const inputStyle = 'h-[58px] w-full rounded-xl border border-[#cbd5e1] bg-white px-5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none transition focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-12 right-0 bottom-0 w-full max-w-2xl bg-white border-l border-[#e2e8f0] flex flex-col shadow-2xl z-40"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
            <h2 className="text-lg font-bold tracking-tight text-[#1e293b]">
              {customerToEdit ? 'Edit Customer' : 'Add Customer'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-[#64748B] transition hover:bg-[#f1f5f9] hover:text-[#1e293b] cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">

                {/* Full Name */}
                <div className="space-y-2.5 md:col-span-2">
                  <label htmlFor="customer-name" className={labelStyle}>
                    Full Name <span className="text-[#116dff]">*</span>
                  </label>
                  <input
                    id="customer-name"
                    value={formData.name}
                    onChange={(e) => changeField('name', e.target.value)}
                    placeholder="Enter full name"
                    className={inputStyle}
                    autoFocus
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2.5">
                  <label htmlFor="customer-phone" className={labelStyle}>
                    Phone Number <span className="text-[#116dff]">*</span>
                  </label>
                  <div className="flex h-[58px] overflow-hidden rounded-xl border border-[#cbd5e1] bg-white focus-within:border-[#116dff] focus-within:ring-2 focus-within:ring-[#116dff]/15">
                    <div className="relative shrink-0 border-r border-[#cbd5e1] bg-[#f8fafc]">
                      <select
                        value={phonePrefix}
                        onChange={(e) => setPhonePrefix(e.target.value)}
                        className="h-full pl-5 pr-9 bg-transparent text-sm font-semibold text-[#334155] outline-none appearance-none cursor-pointer"
                        style={{ accentColor: '#116dff' }}
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+971">+971</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#64748B]" />
                    </div>
                    <input
                      id="customer-phone"
                      value={formData.phone}
                      onChange={(e) => changeField('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className="min-w-0 flex-1 bg-transparent px-5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none"
                      inputMode="tel"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="customer-whatsapp" className={labelStyle}>
                      WhatsApp Number
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (phoneIsComplete) {
                          changeField('whatsappId', formData.phone.trim());
                          setWhatsappPrefix(phonePrefix);
                        }
                      }}
                      disabled={!phoneIsComplete}
                      className="text-xs font-semibold text-[#116dff] hover:text-[#0d5fd9] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Same as phone
                    </button>
                  </div>
                  <div className={`flex h-[58px] overflow-hidden rounded-xl border bg-white transition ${phoneIsComplete ? 'border-[#cbd5e1] focus-within:border-[#116dff] focus-within:ring-2 focus-within:ring-[#116dff]/15' : 'border-[#cbd5e1]/40 opacity-70 cursor-not-allowed'}`}>
                    <div className="relative shrink-0 border-r border-[#cbd5e1] bg-[#f8fafc]">
                      <select
                        value={whatsappPrefix}
                        onChange={(e) => setWhatsappPrefix(e.target.value)}
                        className="h-full pl-5 pr-9 bg-transparent text-sm font-semibold text-[#334155] outline-none appearance-none cursor-pointer disabled:cursor-not-allowed"
                        disabled={!phoneIsComplete}
                        style={{ accentColor: '#116dff' }}
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+971">+971</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#64748B]" />
                    </div>
                    <input
                      id="customer-whatsapp"
                      value={formData.whatsappId}
                      onChange={(e) => changeField('whatsappId', e.target.value)}
                      onFocus={() => {
                        if (phoneIsComplete && !formData.whatsappId.trim()) {
                          changeField('whatsappId', formData.phone.trim());
                          setWhatsappPrefix(phonePrefix);
                        }
                      }}
                      placeholder="Enter WhatsApp number"
                      className="min-w-0 flex-1 bg-transparent px-5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none disabled:cursor-not-allowed"
                      inputMode="tel"
                      disabled={!phoneIsComplete}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2.5">
                  <label htmlFor="customer-email" className={labelStyle}>
                    Email Address <span className="text-[#64748B]">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="customer-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => changeField('email', e.target.value)}
                      placeholder="Enter email address"
                      className={`${inputStyle} pl-14`}
                    />
                  </div>
                </div>

                {/* Customer Type */}
                <div className="space-y-2.5">
                  <label className={labelStyle}>
                    Customer Type
                  </label>
                  <div className="relative" ref={typeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setTypeDropdownOpen((prev) => !prev)}
                      className={`${inputStyle} flex items-center justify-between pr-12 text-left cursor-pointer ${typeDropdownOpen ? 'border-[#116dff] ring-2 ring-[#116dff]/15' : ''}`}
                    >
                      <span>{formData.customerType === 'WALK_IN' ? 'Walk-in Customer' : formData.customerType === 'RETURNING' ? 'Returning Customer' : 'Business Account'}</span>
                    </button>
                    <ChevronDown className={`pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[#64748B] transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} />
                    {typeDropdownOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-lg">
                        {[
                          { value: 'WALK_IN', label: 'Walk-in Customer' },
                          { value: 'RETURNING', label: 'Returning Customer' },
                          { value: 'BUSINESS', label: 'Business Account' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              changeField('customerType', option.value);
                              setTypeDropdownOpen(false);
                            }}
                            className={`w-full px-5 py-3 text-left text-sm transition cursor-pointer ${
                              formData.customerType === option.value
                                ? 'bg-[#116dff] text-white font-semibold'
                                : 'text-[#1e293b] hover:bg-[#f1f5f9]'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs leading-5 text-[#64748B]">
                    Used to group customers in the customer list.
                  </p>
                </div>

                {/* Internal Notes */}
                <div className="space-y-2.5">
                  <label htmlFor="customer-notes" className={labelStyle}>
                    Internal Notes <span className="text-[#64748B]">(optional)</span>
                  </label>
                  <textarea
                    id="customer-notes"
                    value={formData.notes}
                    onChange={(e) => changeField('notes', e.target.value)}
                    placeholder="Add notes for your team"
                    className={`${inputStyle} h-[96px] resize-y py-4`}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2.5">
                  <label htmlFor="customer-location" className={labelStyle}>
                    Location <span className="text-[#64748B]">(optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="customer-location"
                      value={formData.address}
                      onChange={(e) => changeField('address', e.target.value)}
                      placeholder="Enter location"
                      className={`${inputStyle} pl-14`}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-5">
              <button
                type="button"
                onClick={onClose}
                className="h-[54px] min-w-[130px] rounded-xl border border-[#cbd5e1] bg-white px-7 text-sm font-semibold text-[#334155] transition hover:bg-[#f1f5f9] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-[54px] min-w-[162px] items-center justify-center gap-2 rounded-xl bg-[#116dff] hover:bg-[#3b82f6] px-7 text-sm font-bold text-white shadow-lg shadow-[#116dff]/10 transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {customerToEdit ? 'Save Changes' : 'Submit'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
