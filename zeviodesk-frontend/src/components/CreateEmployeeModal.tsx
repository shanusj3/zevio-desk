import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronDown, Loader2, Mail, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TenantUser } from '../lib/api';
import { useCreateUserMutation, useUpdateUserMutation } from '../hooks/useUsersQuery';
import { useAppStore } from '../store/useAppStore';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit: TenantUser | null;
  onCreated?: (employee: TenantUser) => void;
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'ADVISOR' as TenantUser['role'],
  status: 'ACTIVE' as TenantUser['status'],
  address: '',
  emergencyContact: '',
  maxConcurrentJobs: '' as string | number,
};

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
  onCreated,
}) => {
  const { showToast } = useAppStore();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  
  // Custom dropdown states
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Phone prefix state
  const [phonePrefix, setPhonePrefix] = useState('+91');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (employeeToEdit) {
      // Parse phone country code prefix
      const phoneMatch = employeeToEdit.phone?.match(/^(\+\d+)\s*(.*)$/);
      const parsedPhonePrefix = phoneMatch ? phoneMatch[1] : '+91';
      const parsedPhoneBody = phoneMatch ? phoneMatch[2] : (employeeToEdit.phone || '');

      setPhonePrefix(parsedPhonePrefix);
      setFormData({
        name: employeeToEdit.name,
        email: employeeToEdit.email,
        phone: parsedPhoneBody,
        password: '',
        role: employeeToEdit.role,
        status: employeeToEdit.status,
        address: employeeToEdit.address || '',
        emergencyContact: employeeToEdit.emergencyContact || '',
        maxConcurrentJobs: employeeToEdit.maxConcurrentJobs || '',
      });
    } else {
      setPhonePrefix('+91');
      setFormData(emptyForm);
    }
    setError(null);
  }, [employeeToEdit, isOpen]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return setError('Full name is required');
    if (!formData.email.trim()) return setError('Email address is required');
    if (!employeeToEdit && (!formData.password || formData.password.length < 6)) {
      return setError('Password must be at least 6 characters');
    }

    const fullPhone = formData.phone.trim() ? `${phonePrefix} ${formData.phone.trim()}` : null;

    const payload: any = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: fullPhone,
      role: formData.role,
      status: formData.status,
      address: formData.address.trim() || null,
      emergencyContact: formData.emergencyContact.trim() || null,
      maxConcurrentJobs: formData.maxConcurrentJobs ? parseInt(formData.maxConcurrentJobs.toString(), 10) : null,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (employeeToEdit) {
        await updateMutation.mutateAsync({ id: employeeToEdit.id, data: payload });
        showToast('Employee updated successfully', 'success');
        onClose();
      } else {
        const newEmployee = await createMutation.mutateAsync(payload);
        showToast('Employee created successfully', 'success');
        onClose();
        onCreated?.(newEmployee as TenantUser);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const labelStyle = 'block text-sm font-medium text-[#334155]';
  const inputStyle = 'h-[58px] w-full rounded-xl border border-[#cbd5e1] bg-white px-5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none transition focus:border-[#116dff] focus:ring-2 focus:ring-[#116dff]/15';

  const roleLabels: Record<string, string> = {
    TENANT_ADMIN: 'Admin',
    MANAGER: 'Manager',
    TECHNICIAN: 'Technician',
    ADVISOR: 'Advisor',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    SUSPENDED: 'Suspended',
  };

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
              {employeeToEdit ? 'Edit Employee' : 'Register New Employee'}
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
          <form id="employee-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2.5">
                <label className={labelStyle}>
                  Full Name <span className="text-[#116dff]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  className={inputStyle}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email Address */}
                <div className="space-y-2.5">
                  <label className={labelStyle}>
                    Email Address <span className="text-[#116dff]">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    disabled={!!employeeToEdit}
                    className={`${inputStyle} disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2.5">
                  <label className={labelStyle}>Phone Number</label>
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
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className="min-w-0 flex-1 bg-transparent px-5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none"
                      inputMode="tel"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2.5">
                <label className={labelStyle}>
                  Password {employeeToEdit ? <span className="text-[#64748B]">(Leave blank to keep same)</span> : <span className="text-[#116dff]">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={employeeToEdit ? 'Enter password to change' : 'Enter password (min 6 characters)'}
                  className={inputStyle}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Custom Dropdown */}
                <div className="space-y-2.5">
                  <label className={labelStyle}>Role</label>
                  <div className="relative" ref={roleDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setRoleDropdownOpen((prev) => !prev)}
                      className={`${inputStyle} flex items-center justify-between pr-12 text-left cursor-pointer ${roleDropdownOpen ? 'border-[#116dff] ring-2 ring-[#116dff]/15' : ''}`}
                    >
                      <span>{roleLabels[formData.role]}</span>
                    </button>
                    <ChevronDown className={`pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[#64748B] transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                    {roleDropdownOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-lg">
                        {(['ADVISOR', 'TECHNICIAN', 'MANAGER', 'TENANT_ADMIN'] as TenantUser['role'][]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              handleInputChange('role', r);
                              setRoleDropdownOpen(false);
                            }}
                            className={`w-full px-5 py-3 text-left text-sm transition cursor-pointer ${
                              formData.role === r
                                ? 'bg-[#116dff] text-white font-semibold'
                                : 'text-[#1e293b] hover:bg-[#f1f5f9]'
                            }`}
                          >
                            {roleLabels[r]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Custom Dropdown */}
                <div className="space-y-2.5">
                  <label className={labelStyle}>Status</label>
                  <div className="relative" ref={statusDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen((prev) => !prev)}
                      className={`${inputStyle} flex items-center justify-between pr-12 text-left cursor-pointer ${statusDropdownOpen ? 'border-[#116dff] ring-2 ring-[#116dff]/15' : ''}`}
                    >
                      <span>{statusLabels[formData.status]}</span>
                    </button>
                    <ChevronDown className={`pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[#64748B] transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                    {statusDropdownOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-lg">
                        {(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as TenantUser['status'][]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              handleInputChange('status', s);
                              setStatusDropdownOpen(false);
                            }}
                            className={`w-full px-5 py-3 text-left text-sm transition cursor-pointer ${
                              formData.status === s
                                ? 'bg-[#116dff] text-white font-semibold'
                                : 'text-[#1e293b] hover:bg-[#f1f5f9]'
                            }`}
                          >
                            {statusLabels[s]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Max Concurrent Jobs — Technician only */}
              {formData.role === 'TECHNICIAN' && (
                <div className="space-y-2.5">
                  <label className={labelStyle}>Max Concurrent Jobs</label>
                  <input
                    type="number"
                    value={formData.maxConcurrentJobs}
                    onChange={(e) => handleInputChange('maxConcurrentJobs', e.target.value)}
                    placeholder="Enter max concurrent jobs"
                    className={inputStyle}
                  />
                </div>
              )}

              {/* Address */}
              <div className="space-y-2.5">
                <label className={labelStyle}>Address <span className="text-[#64748B]">(optional)</span></label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter address"
                  className={inputStyle}
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2.5">
                <label className={labelStyle}>Emergency Contact <span className="text-[#64748B]">(optional)</span></label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="Enter emergency contact number"
                  className={inputStyle}
                />
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
                {employeeToEdit ? 'Save Changes' : 'Register Employee'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
