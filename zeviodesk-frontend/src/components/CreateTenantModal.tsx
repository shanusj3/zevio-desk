import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle, ChevronDown } from 'lucide-react';
import { Tenant } from '../types';
import { tenantSchema, TenantFormData } from '../lib/schemas';
import { tenantsApi } from '../lib/api';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tenantData: Partial<Tenant>) => void;
  initialData?: Tenant | null;
  isSubmitting?: boolean;
}

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<Tenant>>({
    name: '',
    description: '',
    subdomain: '',
    businessEmail: '',
    phone: '',
    gstNumber: '',
    address: '',
    primaryColor: '#7C3AED',
    secondaryColor: '#14B8A6',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    status: 'Active',
    usersCount: 1,
  });

  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [adminPhoneCountryCode, setAdminPhoneCountryCode] = useState('+91');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof TenantFormData, string>>>({});

  useEffect(() => {
    setErrors({});
    if (initialData) {
      setFormData(initialData);
      if (initialData.logoUrl) setLogoPreview(initialData.logoUrl);
      
      // Parse country code from phone
      if (initialData.phone?.startsWith('+')) {
        const parts = initialData.phone.split(' ');
        if (parts.length > 1) {
          setPhoneCountryCode(parts[0]);
        }
      }
      // Parse country code from adminPhone
      if (initialData.adminPhone?.startsWith('+')) {
        const parts = initialData.adminPhone.split(' ');
        if (parts.length > 1) {
          setAdminPhoneCountryCode(parts[0]);
        }
      }
    } else {
      setFormData({
        name: '',
        description: '',
        subdomain: '',
        businessEmail: '',
        phone: '',
        gstNumber: '',
        address: '',
        primaryColor: '#7C3AED',
        secondaryColor: '#14B8A6',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        status: 'Active',
        usersCount: 1,
      });
      setLogoPreview(null);
      setPhoneCountryCode('+91');
      setAdminPhoneCountryCode('+91');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Auto-generate subdomain from name if creating new
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameVal = e.target.value;
    const updates: Partial<Tenant> = { name: nameVal };
    if (!initialData) {
      const slug = nameVal
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);
      updates.subdomain = slug;
    }
    setFormData((prev) => ({ ...prev, ...updates }));
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
    if (errors.subdomain && !initialData) setErrors((prev) => ({ ...prev, subdomain: undefined }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 2. Upload to S3 via presigned URL
      try {
        setIsUploadingLogo(true);
        
        // If it's a new tenant, generate a UUID for it and store it in formData
        const tenantId = initialData?.id || formData.id || crypto.randomUUID();
        
        if (!initialData && !formData.id) {
          setFormData((prev) => ({ ...prev, id: tenantId }));
        }

        const presigned = await tenantsApi.getPresignedUrl(tenantId, file.type);
        await tenantsApi.uploadToS3(presigned.url, presigned.fields, file);
        
        setFormData((prev) => ({ ...prev, logoUrl: presigned.fileUrl }));
      } catch (err) {
        console.error('Failed to upload logo', err);
        setErrors((prev) => ({ ...prev, logoUrl: 'Failed to upload logo' }));
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const handleFormChange = (field: keyof TenantFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fullPhone = formData.phone?.startsWith('+')
      ? formData.phone
      : `${phoneCountryCode} ${formData.phone || ''}`;

    const fullAdminPhone = formData.adminPhone?.startsWith('+')
      ? formData.adminPhone
      : `${adminPhoneCountryCode} ${formData.adminPhone || ''}`;

    const payload = {
      ...formData,
      phone: fullPhone.trim(),
      adminPhone: fullAdminPhone.trim(),
      status: formData.status || 'Active',
      usersCount: formData.usersCount || 1,
      primaryColor: formData.primaryColor || '#7C3AED',
    };

    // Zod validation
    const result = tenantSchema.safeParse(payload);

    if (!result.success) {
      const formattedErrors: Partial<Record<keyof TenantFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof TenantFormData;
        if (fieldName && !formattedErrors[fieldName]) {
          formattedErrors[fieldName] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Window Container */}
      <div className="relative w-full max-w-2xl bg-[#0f1522] border border-[#1e2a40] rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="p-6 border-b border-[#1e2a40] flex items-center justify-between bg-[#131b2e]">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {initialData ? 'Edit Tenant Details' : 'Add New Tenant'}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-[#64748B] hover:text-white hover:bg-[#182236] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-8 max-h-[78vh] overflow-y-auto"
          noValidate
        >
          {/* SECTION 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#D99B26]">
              Basic Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tenant / Shop Name */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Tenant / Shop Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter tenant or shop name"
                  value={formData.name || ''}
                  onChange={handleNameChange}
                  maxLength={50}
                  className={`w-full h-11 bg-[#141b2b] border ${
                    errors.name ? 'border-[#EF4444]' : 'border-[#23314a] focus:border-[#D99B26]'
                  } rounded-xl px-4 text-xs text-white placeholder-[#64748B] focus:outline-none transition-colors`}
                />
                {errors.name && (
                  <p className="text-[11px] text-[#EF4444] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Enter description (optional)"
                  value={formData.description || ''}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  maxLength={200}
                  className="w-full h-11 bg-[#141b2b] border border-[#23314a] focus:border-[#D99B26] rounded-xl px-4 text-xs text-white placeholder-[#64748B] focus:outline-none transition-colors"
                />
              </div>

              {/* Subdomain */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Subdomain (Slug) <span className="text-[#EF4444]">*</span>
                </label>
                <div
                  className={`flex h-11 rounded-xl bg-[#141b2b] border ${
                    errors.subdomain ? 'border-[#EF4444]' : 'border-[#23314a] focus-within:border-[#D99B26]'
                  } overflow-hidden transition-colors`}
                >
                  <span className="px-3.5 flex items-center text-xs text-[#64748B] border-r border-[#23314a] select-none bg-[#101726] shrink-0 font-mono font-medium">
                    https://
                  </span>
                  <input
                    type="text"
                    placeholder="yourshop"
                    value={formData.subdomain || ''}
                    onChange={(e) =>
                      handleFormChange(
                        'subdomain',
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)
                      )
                    }
                    maxLength={30}
                    className="flex-1 min-w-0 bg-transparent px-4 text-xs text-white placeholder-[#64748B] focus:outline-none font-mono"
                  />
                  <span className="px-3.5 flex items-center text-xs text-[#64748B] border-l border-[#23314a] select-none bg-[#101726] shrink-0 font-mono font-medium whitespace-nowrap">
                    .zeviodesk.com
                  </span>
                </div>
                {errors.subdomain && (
                  <p className="text-[11px] text-[#EF4444] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.subdomain}</span>
                  </p>
                )}
              </div>

              {/* Business Email */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Business Email <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  placeholder="contact@shop.com"
                  value={formData.businessEmail || ''}
                  onChange={(e) => handleFormChange('businessEmail', e.target.value)}
                  maxLength={100}
                  className={`w-full h-11 bg-[#141b2b] border ${
                    errors.businessEmail ? 'border-[#EF4444]' : 'border-[#23314a] focus:border-[#D99B26]'
                  } rounded-xl px-4 text-xs text-white placeholder-[#64748B] focus:outline-none transition-colors`}
                />
                {errors.businessEmail && (
                  <p className="text-[11px] text-[#EF4444] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.businessEmail}</span>
                  </p>
                )}
              </div>

              {/* Phone Number with Prefix */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Phone Number <span className="text-[#EF4444]">*</span>
                </label>
                <div className="flex gap-2.5">
                  <div className="relative shrink-0">
                    <select
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                      className="h-11 bg-[#141b2b] border border-[#23314a] rounded-xl pl-4 pr-9 text-xs text-white font-medium focus:outline-none focus:border-[#D99B26] cursor-pointer appearance-none"
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+971">+971</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={formData.phone?.replace(/^\+\d+\s*/, '') || ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      handleFormChange('phone', digits);
                    }}
                    maxLength={10}
                    className={`flex-1 min-w-0 h-11 bg-[#141b2b] border ${
                      errors.phone ? 'border-[#EF4444]' : 'border-[#23314a] focus:border-[#D99B26]'
                    } rounded-xl px-4 text-xs text-white placeholder-[#64748B] focus:outline-none transition-colors`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-[11px] text-[#EF4444] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* GST Number */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="32ABCDE1234F1Z5"
                  value={formData.gstNumber || ''}
                  onChange={(e) => handleFormChange('gstNumber', e.target.value.toUpperCase())}
                  maxLength={15}
                  className="w-full h-11 bg-[#141b2b] border border-[#23314a] focus:border-[#D99B26] rounded-xl px-4 text-xs text-white placeholder-[#64748B] focus:outline-none transition-colors"
                />
              </div>

              {/* Address */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter complete store address"
                  value={formData.address || ''}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  maxLength={500}
                  className="w-full bg-[#141b2b] border border-[#23314a] focus:border-[#D99B26] rounded-xl p-3.5 text-xs text-white placeholder-[#64748B] focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Branding */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#D99B26]">Branding</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo upload */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Logo
                </label>
                <label className="border-2 border-dashed border-[#23314a] hover:border-[#D99B26] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#141b2b] transition-colors text-center min-h-[90px] group">
                  {logoPreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                      <span className="text-xs text-[#D99B26] underline font-medium">
                        Change Logo
                      </span>
                    </div>
                  ) : isUploadingLogo ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#D99B26] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-white">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-[#64748B] group-hover:text-[#D99B26] mb-1 transition-colors" />
                      <span className="text-xs font-medium text-white">
                        Upload store logo
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        PNG, JPG up to 2MB
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                  />
                </label>
              </div>

              {/* Primary Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-2 bg-[#141b2b] border border-[#23314a] rounded-xl h-11 px-3">
                  <input
                    type="color"
                    value={formData.primaryColor || '#7C3AED'}
                    onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                    className="w-7 h-7 rounded-md cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor || '#7C3AED'}
                    onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                    className="flex-1 bg-transparent text-xs font-mono text-white focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Shop Admin Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#D99B26]">
              Shop Admin Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Admin Name */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Admin Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter admin full name"
                  value={formData.adminName || ''}
                  onChange={(e) => handleFormChange('adminName', e.target.value)}
                  maxLength={50}
                  className={`w-full h-11 bg-[#141b2b] border ${
                    errors.adminName ? 'border-[#EF4444]' : 'border-[#23314a] focus:border-[#D99B26]'
                  } rounded-xl px-4 text-xs text-white placeholder-[#64748B] focus:outline-none transition-colors`}
                />
                {errors.adminName && (
                  <p className="text-[11px] text-[#EF4444] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.adminName}</span>
                  </p>
                )}
              </div>

              {/* Admin Email */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Admin Email <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  placeholder="admin@shop.com"
                  value={formData.adminEmail || ''}
                  onChange={(e) => handleFormChange('adminEmail', e.target.value)}
                  maxLength={100}
                  className={`w-full h-11 bg-[#141b2b] border ${
                    errors.adminEmail ? 'border-[#EF4444]' : 'border-[#23314a] focus:border-[#D99B26]'
                  } rounded-xl px-4 text-xs text-white placeholder-[#64748B] focus:outline-none transition-colors`}
                />
                {errors.adminEmail && (
                  <p className="text-[11px] text-[#EF4444] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.adminEmail}</span>
                  </p>
                )}
              </div>

              {/* Admin Phone */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Admin Phone <span className="text-[#EF4444]">*</span>
                </label>
                <div className="flex gap-2.5">
                  <div className="relative shrink-0">
                    <select
                      value={adminPhoneCountryCode}
                      onChange={(e) => setAdminPhoneCountryCode(e.target.value)}
                      className="h-11 bg-[#141b2b] border border-[#23314a] rounded-xl pl-4 pr-9 text-xs text-white font-medium focus:outline-none focus:border-[#D99B26] cursor-pointer appearance-none"
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+971">+971</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={formData.adminPhone?.replace(/^\+\d+\s*/, '') || ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      handleFormChange('adminPhone', digits);
                    }}
                    maxLength={10}
                    className={`flex-1 min-w-0 h-11 bg-[#141b2b] border ${
                      errors.adminPhone ? 'border-[#EF4444]' : 'border-[#23314a] focus:border-[#D99B26]'
                    } rounded-xl px-4 text-xs text-white placeholder-[#64748B] focus:outline-none transition-colors`}
                  />
                </div>
                {errors.adminPhone && (
                  <p className="text-[11px] text-[#EF4444] font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.adminPhone}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1e2a40] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-11 bg-[#182236] hover:bg-[#202d47] text-white rounded-xl text-xs font-semibold border border-[#2d3d5e] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingLogo}
              className="px-6 h-11 bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold rounded-xl text-xs transition-all shadow-md shadow-[#D99B26]/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
