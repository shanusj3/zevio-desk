import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { AddStatsModal, ALL_AVAILABLE_STATS } from './AddStatsModal';
import { useAppStore } from '../store/useAppStore';
import { reportsApi } from '../lib/api';

interface KeyStatsSectionProps {
  openTicketsCount?: number;
  repairCompletedCount?: number;
  readyPickupCount?: number;
  waitingPartsCount?: number;
  deliveredTodayCount?: number;
  earningsTodayVal?: string;
  inDiagnosisCount?: number;
  inProgressCount?: number;
  newReceivedCount?: number;
  unassignedCount?: number;
  overdueCount?: number;
  avgDurationVal?: string;
  pendingInvoicesVal?: string;
  lowStockCount?: number;
  onNavigateReport?: (reportType: string) => void;
}

export const EditorialKpiSection: React.FC<KeyStatsSectionProps> = ({
  openTicketsCount = 0,
  repairCompletedCount = 0,
  readyPickupCount = 0,
  waitingPartsCount = 0,
  deliveredTodayCount = 0,
  earningsTodayVal = '₹0',
  inDiagnosisCount = 0,
  inProgressCount = 0,
  newReceivedCount = 0,
  unassignedCount = 0,
  overdueCount = 0,
  avgDurationVal = '0 Days',
  pendingInvoicesVal = '₹0',
  lowStockCount = 0,
}) => {
  const { currentUser } = useAppStore();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'TENANT_ADMIN';
  const queryClient = useQueryClient();

  const [isAddStatsModalOpen, setIsAddStatsModalOpen] = useState(false);

  // React Query: Fetch DB-backed User Dashboard Preferences
  const { data: dbPreferences } = useQuery({
    queryKey: ['dashboard-preferences'],
    queryFn: reportsApi.getPreferences,
  });

  // Default fallback stat IDs
  const defaultStatIds = [
    'open-tickets',
    'repair-completed',
    'ready-pickup',
    'waiting-parts',
    'delivered-today',
    ...(isAdmin ? ['earning-today'] : []),
  ];

  const visibleStatIds = dbPreferences?.visibleStatIds && dbPreferences.visibleStatIds.length > 0
    ? dbPreferences.visibleStatIds
    : defaultStatIds;

  // DB Mutation for saving visible stats
  const updatePrefMutation = useMutation({
    mutationFn: (ids: string[]) => reportsApi.updatePreferences(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-preferences'] }),
  });

  const handleSaveVisibleStats = (newStatIds: string[]) => {
    updatePrefMutation.mutate(newStatIds);
  };

  // Map stat IDs to their live values
  const getStatValue = (id: string): string | number => {
    switch (id) {
      case 'open-tickets': return openTicketsCount;
      case 'repair-completed': return repairCompletedCount;
      case 'ready-pickup': return readyPickupCount;
      case 'waiting-parts': return waitingPartsCount;
      case 'delivered-today': return deliveredTodayCount;
      case 'earning-today': return isAdmin ? earningsTodayVal : '₹0';
      case 'in-diagnosis': return inDiagnosisCount;
      case 'in-progress': return inProgressCount;
      case 'new-received': return newReceivedCount;
      case 'unassigned-tickets': return unassignedCount;
      case 'overdue-repairs': return overdueCount;
      case 'avg-duration': return avgDurationVal;
      case 'pending-invoices': return pendingInvoicesVal;
      case 'low-stock-alert': return lowStockCount;
      default: return 0;
    }
  };

  const visibleStatsList = ALL_AVAILABLE_STATS.filter((stat) => {
    if (!isAdmin && stat.id === 'earning-today') return false;
    return visibleStatIds.includes(stat.id);
  });

  return (
    <div className="space-y-4 w-full">
      {/* Outer Key Stats Card Container */}
      <div className="bg-white rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#1e293b] tracking-tight">
            Key stats
          </h2>
          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <button
                onClick={() => setIsAddStatsModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#dfe5eb] bg-white hover:bg-[#116dff] hover:border-[#116dff] text-[#116dff] hover:text-white text-xs font-bold transition-all cursor-pointer group"
              >
                <Plus className="w-3.5 h-3.5 text-[#116dff] group-hover:text-white transition-colors" />
                <span>Add Stats</span>
              </button>
            )}
          </div>
        </div>

        {/* Equal-width Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {visibleStatsList.map((stat) => (
            <div
              key={stat.id}
              className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors rounded-xl p-4 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#4b5675] truncate">
                  {stat.title}
                </span>
              </div>
              <div className="text-2xl font-bold text-[#1e293b] mt-2">
                {getStatValue(stat.id)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Stats Modal (Tenant Admin Only) */}
      {isAdmin && (
        <AddStatsModal
          isOpen={isAddStatsModalOpen}
          onClose={() => setIsAddStatsModalOpen(false)}
          visibleStatIds={visibleStatIds}
          onSaveVisibleStats={(ids) => handleSaveVisibleStats(ids)}
        />
      )}
    </div>
  );
};
