import React, { useState, useEffect } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';

export interface StatItemConfig {
  id: string;
  title: string;
  description: string;
  category: string;
  defaultChecked?: boolean;
}

export const ALL_AVAILABLE_STATS: StatItemConfig[] = [
  // Repairs & Intake
  {
    id: 'open-tickets',
    title: 'Open Tickets',
    description: 'The total number of open tickets currently in repair stages.',
    category: 'Repairs & Intake',
    defaultChecked: true,
  },
  {
    id: 'repair-completed',
    title: 'Repair Completed',
    description: 'Technician-completed repairs awaiting invoice generation.',
    category: 'Repairs & Intake',
    defaultChecked: true,
  },
  {
    id: 'ready-pickup',
    title: 'Ready to Pickup',
    description: 'Invoiced repairs ready to be picked up by customers.',
    category: 'Repairs & Intake',
    defaultChecked: true,
  },
  {
    id: 'waiting-parts',
    title: 'Waiting for Parts',
    description: 'Tickets waiting for replacement parts to be received.',
    category: 'Repairs & Intake',
    defaultChecked: true,
  },
  {
    id: 'delivered-today',
    title: 'Delivered Today',
    description: 'Tickets delivered successfully to customers today.',
    category: 'Repairs & Intake',
    defaultChecked: true,
  },
  {
    id: 'in-diagnosis',
    title: 'In Diagnosis',
    description: 'Devices currently undergoing inspection and testing by technicians.',
    category: 'Repairs & Intake',
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    description: 'Active repairs currently being worked on at the workbench.',
    category: 'Repairs & Intake',
  },
  {
    id: 'new-received',
    title: 'New Received Today',
    description: 'Device intake registrations logged in the shop today.',
    category: 'Repairs & Intake',
  },
  {
    id: 'unassigned-tickets',
    title: 'Unassigned Tickets',
    description: 'New tickets awaiting technician assignment.',
    category: 'Repairs & Intake',
  },
  {
    id: 'overdue-repairs',
    title: 'Overdue Repairs',
    description: 'Repairs exceeding target customer turnaround time.',
    category: 'Repairs & Intake',
  },
  {
    id: 'avg-duration',
    title: 'Avg. Repair Duration',
    description: 'Average turnaround time per repair from intake to completion.',
    category: 'Repairs & Intake',
  },

  // Finance & Inventory
  {
    id: 'earning-today',
    title: 'Earning Today',
    description: 'Total revenue and payments collected today.',
    category: 'Finance & Inventory',
    defaultChecked: true,
  },
  {
    id: 'pending-invoices',
    title: 'Pending / Unpaid Invoices',
    description: 'Outstanding customer balances and unpaid repair bills.',
    category: 'Finance & Inventory',
  },
  {
    id: 'low-stock-alert',
    title: 'Low Stock Parts Alert',
    description: 'Spare parts (screens, batteries, ports) falling below minimum reorder levels.',
    category: 'Finance & Inventory',
  },
];

interface AddStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleStatIds: string[];
  onSaveVisibleStats: (statIds: string[]) => void;
}

export const AddStatsModal: React.FC<AddStatsModalProps> = ({
  isOpen,
  onClose,
  visibleStatIds,
  onSaveVisibleStats,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(visibleStatIds);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(visibleStatIds);
    }
  }, [isOpen, visibleStatIds]);

  const toggleStat = (id: string) => {
    if (selectedIds.includes(id) && selectedIds.length === 1) {
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (selectedIds.length === 0) return;
    onSaveVisibleStats(selectedIds);
    onClose();
  };

  const categories = Array.from(new Set(ALL_AVAILABLE_STATS.map((s) => s.category)));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Customize your key stats"
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-base font-semibold text-[#1e293b]">
          Choose the stats you want to see in your dashboard.
        </p>

        <div className="max-h-[50vh] overflow-y-auto divide-y divide-[#e2e8f0]/60 -mx-6">
          {categories.map((cat) => {
            const catStats = ALL_AVAILABLE_STATS.filter((s) => s.category === cat);
            return (
              <div key={cat}>
                <div className="bg-[#f8fafc] text-[#64748b] text-xs font-bold px-6 py-2.5 border-y border-[#e2e8f0]/60 uppercase tracking-wider">
                  {cat}
                </div>

                <div className="px-6 py-2 divide-y divide-[#f1f5f9]">
                  {catStats.map((stat) => {
                    const isChecked = selectedIds.includes(stat.id);
                    const isLastRemainingStat = isChecked && selectedIds.length === 1;

                    return (
                      <div
                        key={stat.id}
                        onClick={() => !isLastRemainingStat && toggleStat(stat.id)}
                        className={`flex items-start gap-3.5 py-3 rounded-lg px-1 transition ${
                          isLastRemainingStat
                            ? 'opacity-85 cursor-not-allowed bg-gray-50/50'
                            : 'cursor-pointer group hover:bg-[#f8fafc]/60'
                        }`}
                      >
                        <div className="relative group/tooltip mt-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isLastRemainingStat}
                            onChange={() => {}}
                            className={`w-4 h-4 rounded transition-all ${
                              isLastRemainingStat
                                ? 'border-gray-400 bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-[#116dff] text-[#116dff] focus:ring-0 cursor-pointer'
                            }`}
                          />
                          {isLastRemainingStat && (
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover/tooltip:block z-50 w-64 p-2 bg-[#1e293b] text-white text-[11px] font-medium rounded-lg shadow-xl animate-in fade-in duration-150 pointer-events-none whitespace-normal">
                              Choose atleast one stats to show in your shop overview
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-semibold transition-colors ${
                            isLastRemainingStat ? 'text-[#1e293b]' : 'text-[#1e293b] group-hover:text-[#116dff]'
                          }`}>
                            {stat.title}
                          </div>
                          <div className="text-xs text-[#64748b] leading-relaxed mt-0.5">
                            {stat.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
};
