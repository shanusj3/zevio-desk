import React, { useState, useEffect } from 'react';
import { Loader2, Upload, Building, Mail, Phone, MapPin, FileText, CheckCircle2, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import { useInvoicingSettingsQuery, useUpdateInvoiceTemplateMutation } from '../hooks/useInvoicesQuery';
import { useAppStore } from '../store/useAppStore';

export const InvoiceTemplateSettings: React.FC = () => {
  const { showToast } = useAppStore();
  const { data: settings, isLoading } = useInvoicingSettingsQuery();
  const updateMutation = useUpdateInvoiceTemplateMutation();

  const [shopName, setShopName] = useState('');
  const [emails, setEmails] = useState<string[]>(['']);
  const [phones, setPhones] = useState<string[]>(['']);
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [termsNotes, setTermsNotes] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#116dff');

  useEffect(() => {
    if (settings) {
      setShopName(settings.name || '');

      const fetchedEmails = settings.businessEmail
        ? settings.businessEmail.split(',').map(s => s.trim()).filter(Boolean)
        : [''];
      setEmails(fetchedEmails.length > 0 ? fetchedEmails.slice(0, 3) : ['']);

      const fetchedPhones = settings.phone
        ? settings.phone.split(',').map(s => s.trim()).filter(Boolean)
        : [''];
      setPhones(fetchedPhones.length > 0 ? fetchedPhones.slice(0, 3) : ['']);

      setAddress(settings.address || '');
      setGstNumber(settings.gstNumber || '');
      setLogoUrl(settings.logoUrl || '');
      setTermsNotes(settings.description || '');
      setPrimaryColor(settings.primaryColor || '#116dff');
    }
  }, [settings]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo image must be smaller than 2MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const validEmails = emails.map(e => e.trim()).filter(Boolean);
    const validPhones = phones.map(p => p.trim()).filter(Boolean);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;

    for (const ph of validPhones) {
      if (!phoneRegex.test(ph)) {
        showToast(`Invalid phone number format: "${ph}"`, 'warning');
        return;
      }
    }

    for (const em of validEmails) {
      if (!emailRegex.test(em)) {
        showToast(`Invalid email address format: "${em}"`, 'warning');
        return;
      }
    }

    try {
      const joinedEmails = validEmails.slice(0, 3).join(', ');
      const joinedPhones = validPhones.slice(0, 3).join(', ');

      await updateMutation.mutateAsync({
        name: shopName.trim() || null,
        businessEmail: joinedEmails || null,
        phone: joinedPhones || null,
        address: address.trim() || null,
        gstNumber: gstNumber.trim() || null,
        logoUrl: logoUrl.trim() || null,
        description: termsNotes.trim() || null,
        primaryColor: primaryColor || '#116dff',
      });
      showToast('Invoice template settings saved successfully!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save template settings', 'warning');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#D99B26]" />
      </div>
    );
  }

  const validEmails = emails.map(e => e.trim()).filter(Boolean);
  const validPhones = phones.map(p => p.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white">Invoice Template & Shop Customization</h2>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Customize your shop logo, business address, contact details (up to 3 phone numbers & 3 emails), and default footer terms.
        </p>
      </div>

      {/* Main Grid: Left Config Form + Right Live Printable Sheet Wireframe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: Customization Controls Form (6 cols) */}
        <div className="lg:col-span-6 space-y-6 bg-[#111827] border border-[#1f293d] p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#1f293d] pb-3">
            Shop & Business Details ("From")
          </h3>

          {/* Logo Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">Shop Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-20 bg-[#182030] border border-dashed border-[#2d3b54] rounded-xl flex flex-col items-center justify-center overflow-hidden shrink-0 relative group">
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-contain p-1" />
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="absolute inset-0 bg-black/70 text-red-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-6 h-6 text-[#475569]" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#182030] hover:bg-[#202c42] border border-[#1f293d] text-white text-xs font-semibold rounded-xl cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 text-[#D99B26]" />
                  Upload Image File
                  <input type="file" accept="image/*" onChange={handleLogoFileUpload} className="hidden" />
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="Or paste Logo Image URL (https://...)"
                  className="w-full h-9 px-3 rounded-xl bg-[#182030] border border-[#1f293d] text-xs text-white placeholder:text-[#475569] outline-none focus:border-[#D99B26]"
                />
              </div>
            </div>
          </div>

          {/* Business Details Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase tracking-wide">Business / Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="e.g. Zevio Tech Repair Services"
                className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white focus:border-[#D99B26] outline-none"
              />
            </div>

            {/* Phone Number(s) TOP - Max 3 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Phone Number(s) <span className="text-[10px] text-[#6B7280]">(Max 3)</span>
                </label>
                {phones.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setPhones([...phones, ''])}
                    className="text-[11px] font-semibold text-[#D99B26] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Phone
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {phones.map((ph, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={ph}
                      onChange={e => {
                        const next = [...phones];
                        next[idx] = e.target.value;
                        setPhones(next);
                      }}
                      placeholder={idx === 0 ? "Primary Phone (+91 98765 43210)" : `Additional Phone #${idx + 1}`}
                      className="w-full h-11 px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white focus:border-[#D99B26] outline-none"
                    />
                    {phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                        className="p-2 text-[#9CA3AF] hover:text-red-400 cursor-pointer"
                        title="Remove Phone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Business Email(s) BOTTOM - Max 3 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Business Email(s) <span className="text-[10px] text-[#6B7280]">(Max 3)</span>
                </label>
                {emails.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setEmails([...emails, ''])}
                    className="text-[11px] font-semibold text-[#D99B26] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Email
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {emails.map((em, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="email"
                      value={em}
                      onChange={e => {
                        const next = [...emails];
                        next[idx] = e.target.value;
                        setEmails(next);
                      }}
                      placeholder={idx === 0 ? "Primary Email (contact@shop.com)" : `Additional Email #${idx + 1}`}
                      className="w-full h-11 px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white focus:border-[#D99B26] outline-none"
                    />
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEmails(emails.filter((_, i) => i !== idx))}
                        className="p-2 text-[#9CA3AF] hover:text-red-400 cursor-pointer"
                        title="Remove Email"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase tracking-wide">Shop Address / Location</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Street address, City, State, Pincode"
                className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white focus:border-[#D99B26] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase tracking-wide">GSTIN / Tax ID Number</label>
              <input
                type="text"
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value)}
                placeholder="29AAAAA0000A1Z5"
                className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white font-mono focus:border-[#D99B26] outline-none"
              />
            </div>

            {/* Brand Primary Color */}
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase tracking-wide">
                Brand Primary Color
              </label>
              <p className="text-[11px] text-[#6B7280] mb-2">
                Used throughout your tenant dashboard — buttons, badges, and accents.
              </p>
              <div className="flex items-center gap-3">
                {/* Native color picker swatch */}
                <label className="relative shrink-0 cursor-pointer">
                  <div
                    className="w-10 h-10 rounded-xl border-2 border-[#2d3b54] shadow-md transition-transform hover:scale-105"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Pick brand color"
                  />
                </label>

                {/* Hex text input */}
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setPrimaryColor(val);
                  }}
                  placeholder="#116dff"
                  maxLength={7}
                  className="flex-1 h-10 px-3 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white font-mono focus:border-[#D99B26] outline-none"
                />

                {/* Preset swatches */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['#116dff', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#6366F1'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      title={c}
                      className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-125 shrink-0"
                      style={{
                        backgroundColor: c,
                        borderColor: primaryColor === c ? '#fff' : 'transparent',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase tracking-wide">Footer Terms & Notes</label>
              <textarea
                value={termsNotes}
                onChange={e => setTermsNotes(e.target.value)}
                placeholder="Notes - any relevant information, warranty terms, or return policies..."
                className="w-full min-h-[90px] p-3 rounded-xl bg-[#182030] border border-[#1f293d] text-xs text-white focus:border-[#D99B26] outline-none resize-y"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full h-[50px] bg-[#D99B26] hover:bg-[#e5a93c] text-[#0d121c] font-bold text-sm rounded-xl transition cursor-pointer shadow-lg shadow-[#D99B26]/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Save Template Customization</>}
          </button>
        </div>

        {/* RIGHT COLUMN: Live Printable Invoice Sheet Wireframe Preview (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Live Invoice Preview</span>
          </div>

          {/* Printable Invoice Wireframe Paper Sheet */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">

            {/* Top Wireframe Header: Invoice Title on Left, Logo on Right */}
            <div className="flex items-start justify-between border-b border-[#1f293d] pb-5">
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-white tracking-tight uppercase">Invoice</h3>
                <p className="text-xs font-mono text-[#D99B26]">#INV-2026-08001</p>
                <p className="text-[11px] text-[#9CA3AF]">Date: Aug 19, 2026</p>
              </div>

              {/* Logo Box Wireframe */}
              <div className="w-32 h-16 border border-[#2d3b54] rounded-xl flex items-center justify-center bg-[#182030] overflow-hidden p-2 text-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="flex items-center gap-1.5 text-[#6B7280] text-xs font-medium">
                    <ImageIcon className="w-4 h-4" />
                    <span>+ Logo</span>
                  </div>
                )}
              </div>
            </div>

            {/* From & Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 bg-[#182030] p-4 rounded-xl border border-[#1f293d] text-xs font-mono">
              <div className="space-y-1">
                <div><span className="text-[#64748B]">Billed To:</span> <span className="text-white font-bold">N NIHAL SINGH</span></div>
                <div><span className="text-[#64748B]">Mobile:</span> <span className="text-[#CBD5E1]">+91 70024 43167</span></div>
                <div><span className="text-[#64748B]">Address:</span> <span className="text-[#CBD5E1]">Harish Residency, Assam</span></div>
                <div><span className="text-[#64748B]">Technician:</span> <span className="text-[#CBD5E1]">Suman Ahmed</span></div>
              </div>
              <div className="space-y-1">
                <div><span className="text-[#64748B]">Jobcard No:</span> <span className="text-white font-bold">#TK-13117</span></div>
                <div><span className="text-[#64748B]">Invoice Date:</span> <span className="text-[#CBD5E1]">19-08-2026</span></div>
                <div><span className="text-[#64748B]">Invoice Type:</span> <span className="text-[#D99B26] font-bold">Cash / Paid</span></div>
                <div><span className="text-[#64748B]">Model Name:</span> <span className="text-white font-bold">KTM 200 DUKE</span></div>
              </div>
            </div>

            {/* Wireframe Part Invoice Table */}
            <div className="space-y-1.5">
              <div className="bg-[#182030] px-3 py-1 rounded-t-lg border border-[#1f293d] font-bold text-[11px] text-white uppercase flex justify-between">
                <span>Part Invoice</span>
                <span className="text-[10px] text-[#9CA3AF]">Hardware & Components</span>
              </div>
              <div className="border border-[#1f293d] rounded-b-lg overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-[#182030] border-b border-[#1f293d] text-[#6B7280] uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-2 py-2 text-center">Tax %</th>
                      <th className="px-2 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d] text-[#9CA3AF]">
                    <tr>
                      <td className="px-3 py-2 text-white font-medium">
                        <div>OIL FILTER — Genuine OEM Part</div>
                        <div className="text-[10px] text-[#D99B26] font-semibold mt-0.5">Warranty: 6 months (Full replacement warranty)</div>
                      </td>
                      <td className="px-2 py-2 text-center font-mono">18%</td>
                      <td className="px-2 py-2 text-center font-mono">1</td>
                      <td className="px-3 py-2 text-right font-mono">₹464.41</td>
                      <td className="px-3 py-2 text-right font-mono text-white">₹464.41</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wireframe Labour Invoice Table */}
            <div className="space-y-1.5">
              <div className="bg-[#182030] px-3 py-1 rounded-t-lg border border-[#1f293d] font-bold text-[11px] text-white uppercase flex justify-between">
                <span>Labour Invoice</span>
                <span className="text-[10px] text-[#9CA3AF]">Service & Repair</span>
              </div>
              <div className="border border-[#1f293d] rounded-b-lg overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-[#182030] border-b border-[#1f293d] text-[#6B7280] uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-2 py-2 text-center">Tax %</th>
                      <th className="px-2 py-2 text-center">Units</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d] text-[#9CA3AF]">
                    <tr>
                      <td className="px-3 py-2 text-white font-medium">Full Paid Repair & Maintenance Service</td>
                      <td className="px-2 py-2 text-center font-mono">18%</td>
                      <td className="px-2 py-2 text-center font-mono">1</td>
                      <td className="px-3 py-2 text-right font-mono">₹1,200.00</td>
                      <td className="px-3 py-2 text-right font-mono text-white">₹1,200.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary & Signatory Box */}
            <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
              <div className="bg-[#182030] p-3 rounded-xl border border-[#1f293d] space-y-2">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Workshop Remarks</span>
                <p className="text-[11px] text-[#9CA3AF]">Routine maintenance & part replacement completed.</p>
                <div className="pt-3 border-t border-[#1f293d] text-center">
                  <p className="text-[10px] font-bold text-white uppercase">{shopName || 'Zevio Tech Services'}</p>
                  <p className="text-[9px] text-[#64748B] uppercase">Authorised Signatory</p>
                </div>
              </div>
              <div className="bg-[#182030] p-3 rounded-xl border border-[#1f293d] space-y-2 font-mono">
                <div className="flex justify-between border-b border-[#1f293d] pb-1 font-bold">
                  <span className="text-white">Amount Payable</span>
                  <span className="text-[#D99B26]">₹1,664.41</span>
                </div>
                <p className="text-[10px] text-[#CBD5E1] font-bold uppercase">RS ONE THOUSAND SIX HUNDRED SIXTY FOUR ONLY</p>
              </div>
            </div>

            {/* Bottom Wireframe Notes & Terms Box */}
            <div className="bg-[#182030] p-3 rounded-xl border border-[#1f293d] space-y-1">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase block">
                Notes / Terms & Conditions
              </span>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                {termsNotes || 'Notes - any relevant information, warranty terms, or return policies...'}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};


