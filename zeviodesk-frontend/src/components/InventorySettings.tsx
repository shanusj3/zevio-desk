import React from 'react';
import { ToggleLeft, ToggleRight, Package, ShieldCheck, AlertCircle } from 'lucide-react';
import { useInvoicingSettingsQuery, useUpdateInvoiceTemplateMutation } from '../hooks/useInvoicesQuery';
import { useAppStore } from '../store/useAppStore';

export const InventorySettings: React.FC = () => {
  const { showToast } = useAppStore();
  const { data: settings, isLoading } = useInvoicingSettingsQuery();
  const updateSettingsMutation = useUpdateInvoiceTemplateMutation();

  const isEnabled = settings?.inventoryEnabled ?? false;

  const handleToggle = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        ...settings,
        inventoryEnabled: !isEnabled,
      });
      showToast(
        `Inventory management turned ${!isEnabled ? 'ON' : 'OFF'}`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle inventory settings', 'warning');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-[#D99B26] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white tracking-tight">Inventory Management Settings</h3>
        <p className="text-xs text-[#94A3B8] mt-1">
          Enable or disable the optional stock-tracking layer for repair parts.
        </p>
      </div>

      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-[#D99B26] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Track Parts Stock &amp; Movements</p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Enable this to auto-deduct part counts on approval, maintain low-stock alerts, and track audit movement logs.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={updateSettingsMutation.isPending}
            className="text-[#D99B26] hover:text-white transition-colors cursor-pointer outline-none focus:outline-none"
          >
            {isEnabled ? (
              <ToggleRight className="w-14 h-8 text-[#D99B26]" />
            ) : (
              <ToggleLeft className="w-14 h-8 text-[#64748B]" />
            )}
          </button>
        </div>

        <div className="border-t border-[#1f293d] pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#14532D]/10 border border-[#16A34A]/20">
            <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-emerald-400">Option 1 — Inventory Off (Default)</p>
              <p className="text-[#94A3B8] mt-1">
                Technicians add parts manually to tickets by typing description &amp; price. Perfect for solo operators or shops without storage tracking needs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#1e3a8a]/10 border border-[#2563eb]/20">
            <ShieldCheck className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-blue-400">Option 2 — Inventory On</p>
              <p className="text-[#94A3B8] mt-1">
                Adds a searchable parts database, stock quantity tracking, adjustments log, and low-stock warning indicators while keeping manual fallback enabled.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-[#94A3B8]">
          <p className="font-semibold text-white">Why it's safe to toggle:</p>
          <p className="mt-1 leading-relaxed">
            Turning inventory off will **never** delete your spare parts catalog or historical stock movements. It simply hides the inventory tabs and stops enforcement, meaning existing ticket bills remain 100% correct.
          </p>
        </div>
      </div>
    </div>
  );
};
