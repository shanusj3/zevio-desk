import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, Shield, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { TenantUser } from '../lib/api';
import { useCreateUserMutation, useUpdateUserMutation } from '../hooks/useUsersQuery';
import { useAppStore } from '../store/useAppStore';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit: TenantUser | null;
  onCreated?: (employee: TenantUser) => void;
}

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
  onCreated,
}) => {
  const { showToast } = useAppStore();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'ADVISOR' as TenantUser['role'],
    status: 'ACTIVE' as TenantUser['status'],
    address: '',
    emergencyContact: '',
    maxConcurrentJobs: '' as string | number,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        name: employeeToEdit.name,
        email: employeeToEdit.email,
        phone: employeeToEdit.phone || '',
        password: '',
        role: employeeToEdit.role,
        status: employeeToEdit.status,
        address: employeeToEdit.address || '',
        emergencyContact: employeeToEdit.emergencyContact || '',
        maxConcurrentJobs: employeeToEdit.maxConcurrentJobs || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'ADVISOR',
        status: 'ACTIVE',
        address: '',
        emergencyContact: '',
        maxConcurrentJobs: '',
      });
    }
    setError(null);
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
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

    const payload: any = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-6">
      {/* Backdrop */}
      <button aria-label="Close dialog" className="fixed inset-0 cursor-default bg-black/80 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal Content */}
      <section role="dialog" aria-modal="true" className="relative z-10 flex max-h-[calc(100dvh-1rem)] w-full max-w-[850px] flex-col overflow-hidden rounded-lg sm:max-h-[calc(100dvh-3rem)] border border-white/[0.06] bg-[linear-gradient(135deg,#232a3a_0%,#1b212e_100%)] shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 pt-5 sm:px-9 sm:pt-7">
          <h2 className="text-[22px] font-semibold tracking-tight text-white">
            {employeeToEdit ? 'Edit Employee Details' : 'Register New Employee'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-[#aeb3c0] transition hover:bg-white/10 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        <form id="employee-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-9 sm:py-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#c8cad3]">
              Full Name <span className="text-[#e5bb5e]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter full name"
              className="h-[58px] w-full rounded-xl border border-white/[0.035] bg-[#303748] px-5 text-sm text-white placeholder:text-[#a4a8b5] outline-none transition focus:border-[#d8ab4d] focus:ring-2 focus:ring-[#d8ab4d]/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#c8cad3]">
                Email Address <span className="text-[#e5bb5e]">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled={!!employeeToEdit}
                className="h-[58px] w-full rounded-xl border border-white/[0.035] bg-[#303748] px-5 text-sm text-white placeholder:text-[#a4a8b5] outline-none transition focus:border-[#d8ab4d] focus:ring-2 focus:ring-[#d8ab4d]/15 disabled:opacity-50"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#c8cad3]">Phone Number</label>
              <div className="flex h-[58px] overflow-hidden rounded-xl border border-white/[0.035] bg-[#303748] focus-within:border-[#d8ab4d] focus-within:ring-2 focus-within:ring-[#d8ab4d]/15">
                <span className="flex w-[68px] items-center justify-center border-r border-black/10 text-sm font-semibold text-white">+91</span>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  className="min-w-0 flex-1 bg-transparent px-5 text-sm text-white placeholder:text-[#a4a8b5] outline-none"
                  inputMode="tel"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#c8cad3]">
              Password {employeeToEdit ? <span className="text-[#a4a8b5]">(Leave blank to keep same)</span> : <span className="text-[#e5bb5e]">*</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={employeeToEdit ? 'Enter password to change' : 'Enter password (min 6 characters)'}
              className="h-[58px] w-full rounded-xl border border-white/[0.035] bg-[#303748] px-5 text-sm text-white placeholder:text-[#a4a8b5] outline-none transition focus:border-[#d8ab4d] focus:ring-2 focus:ring-[#d8ab4d]/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#c8cad3]">Role</label>
              <div className="relative">
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="h-[58px] w-full appearance-none rounded-xl border border-white/[0.035] bg-[#303748] px-5 pr-12 text-sm text-white outline-none transition focus:border-[#d8ab4d] focus:ring-2 focus:ring-[#d8ab4d]/15"
                >
                  <option value="ADVISOR">Advisor</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="MANAGER">Manager</option>
                  <option value="TENANT_ADMIN">Admin</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[#e5bb5e]" />
              </div>
            </div>

            {/* Status dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#c8cad3]">Status</label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="h-[58px] w-full appearance-none rounded-xl border border-white/[0.035] bg-[#303748] px-5 pr-12 text-sm text-white outline-none transition focus:border-[#d8ab4d] focus:ring-2 focus:ring-[#d8ab4d]/15"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[#e5bb5e]" />
              </div>
            </div>
          </div>

          {/* Max Concurrent Jobs — Technician only */}
          {formData.role === 'TECHNICIAN' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#c8cad3]">Max Concurrent Jobs</label>
              <input
                type="number"
                value={formData.maxConcurrentJobs}
                onChange={(e) => handleInputChange('maxConcurrentJobs', e.target.value)}
                placeholder="Enter max concurrent jobs"
                className="h-[58px] w-full rounded-xl border border-white/[0.035] bg-[#303748] px-5 text-sm text-white placeholder:text-[#a4a8b5] outline-none transition focus:border-[#d8ab4d] focus:ring-2 focus:ring-[#d8ab4d]/15"
              />
            </div>
          )}

          {/* Address */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#c8cad3]">Address <span className="text-[#a4a8b5]">(optional)</span></label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter address"
              className="h-[58px] w-full rounded-xl border border-white/[0.035] bg-[#303748] px-5 text-sm text-white placeholder:text-[#a4a8b5] outline-none transition focus:border-[#d8ab4d] focus:ring-2 focus:ring-[#d8ab4d]/15"
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#c8cad3]">Emergency Contact <span className="text-[#a4a8b5]">(optional)</span></label>
            <input
              type="text"
              value={formData.emergencyContact}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              placeholder="Enter emergency contact"
              className="h-[58px] w-full rounded-xl border border-white/[0.035] bg-[#303748] px-5 text-sm text-white placeholder:text-[#a4a8b5] outline-none transition focus:border-[#d8ab4d] focus:ring-2 focus:ring-[#d8ab4d]/15"
            />
          </div>

          </div>
        </form>
        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/[0.06] bg-[#1b212e] px-5 py-5 sm:px-9 sm:py-6">
          <button type="button" onClick={onClose} className="h-[54px] min-w-[130px] rounded-xl border border-[#d3a944] px-7 text-sm font-semibold text-[#e5bb5e] transition hover:bg-[#d3a944]/10">
            Cancel
          </button>
          <button type="submit" form="employee-form" disabled={isSubmitting} className="flex h-[54px] min-w-[162px] items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#f0cd77_0%,#d9a743_100%)] px-7 text-sm font-bold text-[#17191e] shadow-lg shadow-[#d9a743]/10 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {employeeToEdit ? 'Save Changes' : 'Register Employee'}
          </button>
        </div>
      </section>
    </div>
  );
};
