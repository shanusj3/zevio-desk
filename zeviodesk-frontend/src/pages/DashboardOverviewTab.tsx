import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatCard } from '../components/StatCard';
import { EditorialKpiSection } from '../components/EditorialKpiSection';
import { TicketsTable } from '../components/TicketsTable';
import { DateFilter } from '../components/DateFilter';
import { PageHeader } from '../components/PageHeader';
import { useTicketsQuery } from '../hooks/useTicketsQuery';
import { useInventoryItemsQuery } from '../hooks/useInventoryQuery';
import { ticketsApi, reportsApi, Ticket } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { navigate, ticketDetailPath } from '../lib/navigation';
import { DateFilterOption, DateRange, getDateRangeParams } from '../lib/filterUtils';
import { getRoleDefaultStatuses } from '../lib/ticketDisplay';
import { downloadCsv } from '../lib/csvExport';
import { Plus, MessageSquare } from 'lucide-react';
import whatsappConnectModalImg from '../assets/whatsapp_connect_modal_img.png';

interface DashboardOverviewTabProps {
  onOpenCreateTicket: () => void;
  onOpenWhatsAppModal: () => void;
}

export const DashboardOverviewTab: React.FC<DashboardOverviewTabProps> = ({
  onOpenCreateTicket,
  onOpenWhatsAppModal,
}) => {
  const { currentUser, showToast } = useAppStore();
  const role = currentUser?.role ?? '';

  const [dateOption, setDateOption] = useState<DateFilterOption>('THIS_MONTH');
  const [customRange, setCustomRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [ticketsFilteredCount, setTicketsFilteredCount] = useState(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const dateParams = getDateRangeParams(dateOption, customRange);
  const roleDefaultStatuses = getRoleDefaultStatuses(role);

  // Dedicated Real-time Dashboard Stats API Query
  const { data: dashStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: reportsApi.getDashboardStats,
    refetchInterval: 10000, // Auto-refresh stats every 10 seconds
  });

  // Queries
  const { data: tickets = [] } = useTicketsQuery({
    ...(role === 'TECHNICIAN' || role === 'ADVISOR' ? {} : dateParams),
    ...(roleDefaultStatuses ? { statusIn: roleDefaultStatuses } : {}),
  });
  const { data: allTicketsList = [] } = useTicketsQuery({});
  const { data: readyForPickupTickets = [] } = useQuery({
    queryKey: ['ready-for-pickup'],
    queryFn: ticketsApi.readyForPickup,
    enabled: role !== 'TECHNICIAN',
  });
  const { data: inventoryData } = useInventoryItemsQuery({ lowStockOnly: true });

  // Today's Date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Computed Real API Dashboard Metrics
  const totalTickets = tickets.length;
  const inRepairTickets = tickets.filter(
    (t) => t.status === 'DIAGNOSING' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_FOR_PARTS'
  ).length;
  const readyPickupCount = readyForPickupTickets.length;
  const completedTickets = tickets.filter((t) => t.status === 'COMPLETED').length;

  const totalRevenue = tickets.reduce((sum, t) => sum + (t.totalAmount ?? t.estimatedCost ?? 0), 0);

  const myAssignedTickets = tickets.filter((t) => t.assignedToId === currentUser?.id);
  const myAssignedCount = myAssignedTickets.length;
  const myCompletedTodayCount = myAssignedTickets.filter((t) => {
    if (t.status !== 'COMPLETED') return false;
    const compDate = t.updatedAt ? new Date(t.updatedAt) : null;
    return compDate && compDate >= today;
  }).length;
  const myPendingRepairCount = myAssignedTickets.filter(
    (t) => t.status === 'DIAGNOSING' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_FOR_PARTS'
  ).length;

  const advisorPendingApprovalCount = tickets.filter((t) => t.status === 'WAITING_FOR_PARTS').length;
  const advisorCreatedCount = tickets.length;

  // Dedicated Backend Endpoint KPI stats
  const realOpenTicketsCount = dashStats?.openTicketsCount ?? allTicketsList.filter(t => t.status !== 'DELIVERED' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
  const realRepairCompletedCount = (dashStats as any)?.repairCompletedCount ?? allTicketsList.filter(t => t.status === 'REPAIR_COMPLETED').length;
  const realReadyPickupCount = dashStats?.readyPickupCount ?? allTicketsList.filter(t => t.status === 'READY_FOR_PICKUP').length;
  const realWaitingPartsCount = dashStats?.waitingPartsCount ?? allTicketsList.filter(t => t.status === 'WAITING_FOR_PARTS').length;
  const realDeliveredTodayCount = dashStats?.deliveredTodayCount ?? allTicketsList.filter(t => {
    if (t.status !== 'DELIVERED' && t.status !== 'COMPLETED') return false;
    const compDate = t.updatedAt ? new Date(t.updatedAt) : null;
    return compDate && compDate >= today;
  }).length;
  const realNewReceivedTodayCount = dashStats?.newReceivedCount ?? allTicketsList.filter(t => {
    const cDate = t.createdAt ? new Date(t.createdAt) : null;
    return cDate && cDate >= today;
  }).length;
  const realInDiagnosisCount = dashStats?.inDiagnosisCount ?? allTicketsList.filter(t => t.status === 'DIAGNOSING').length;
  const realInProgressCount = dashStats?.inProgressCount ?? allTicketsList.filter(t => t.status === 'IN_PROGRESS').length;
  const realUnassignedCount = dashStats?.unassignedCount ?? allTicketsList.filter(t => !t.assignedToId && t.status !== 'DELIVERED' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
  const realOverdueCount = dashStats?.overdueCount ?? allTicketsList.filter(t => {
    if (t.status === 'DELIVERED' || t.status === 'COMPLETED' || t.status === 'CANCELLED' || !t.createdAt) return false;
    return (Date.now() - new Date(t.createdAt).getTime()) > 3 * 86400000;
  }).length;
  const realPendingInvoicesVal = dashStats?.pendingInvoicesVal ?? '₹0';
  const realEarningsTodayVal = dashStats?.earningsTodayVal ?? `₹${totalRevenue.toLocaleString('en-IN')}`;
  const realLowStockCount = dashStats?.lowStockCount ?? (inventoryData?.total ?? (inventoryData?.items ?? []).length);

  // Handle Export CSV
  const handleExportTickets = (scope: 'all' | 'filtered' | 'selected') => {
    const sourceList = scope === 'all' ? allTicketsList : tickets;
    if (sourceList.length === 0) {
      showToast('No repair tickets available to export', 'warning');
      return;
    }
    const headers = ['Ticket Number', 'Customer ID', 'Device', 'Status', 'Estimated Cost', 'Total Amount', 'Created At'];
    const rows = sourceList.map((t) => [
      t.jobNumber || t.id,
      t.customerId || '',
      `${t.brand || ''} ${t.model || ''}`.trim(),
      t.status,
      String(t.estimatedCost || 0),
      String(t.totalAmount || 0),
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
    ]);

    downloadCsv(`tickets_export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast(`Exported ${rows.length} tickets to CSV`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Role-tailored Page Header */}
      {role === 'ADMIN' && (
        <PageHeader
          title="Dashboard Overview"
          subtitle="Real-time KPI metrics, repair activity, and revenue tracking"
          primaryAction={{ label: 'New Repair Ticket', onClick: onOpenCreateTicket }}
          exportConfig={{
            allCount: allTicketsList.length,
            filteredCount: ticketsFilteredCount,
            exportTitle: 'Export Repair Tickets',
            exportDescription: 'Your repair tickets and shop data will be downloaded as a CSV file.',
            onExport: handleExportTickets,
          }}
          exportDescription="Export your repair ticket database to a CSV file."
          isExportModalOpen={isExportModalOpen}
          onExportModalOpenChange={setIsExportModalOpen}
        />
      )}

      {role === 'TECHNICIAN' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Technician Workspace</h1>
            <p className="text-xs text-[#64748B] mt-1">Your active repair workbench, diagnostics &amp; assigned tasks</p>
          </div>
          <button
            onClick={onOpenCreateTicket}
            className="flex items-center gap-2 px-5 h-10 bg-primary hover:opacity-90 text-white font-semibold rounded-full text-sm transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Repair Ticket
          </button>
        </div>
      )}

      {role === 'ADVISOR' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Service Desk</h1>
            <p className="text-xs text-[#64748B] mt-1">Customer check-ins, approvals, and pickup management</p>
          </div>
          <button
            onClick={onOpenCreateTicket}
            className="flex items-center gap-2 px-5 h-10 bg-primary hover:opacity-90 text-white font-semibold rounded-full text-sm transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Repair Ticket
          </button>
        </div>
      )}

      {/* Date Filter Bar */}
      {role === 'ADMIN' && (
        <div className="flex justify-end">
          <DateFilter
            option={dateOption}
            setOption={setDateOption}
            customRange={customRange}
            setCustomRange={setCustomRange}
          />
        </div>
      )}

      {/* KPI Section with Dedicated /reports/dashboard-stats API Props */}
      <EditorialKpiSection
        openTicketsCount={realOpenTicketsCount}
        repairCompletedCount={realRepairCompletedCount}
        readyPickupCount={realReadyPickupCount}
        waitingPartsCount={realWaitingPartsCount}
        deliveredTodayCount={realDeliveredTodayCount}
        earningsTodayVal={realEarningsTodayVal}
        inDiagnosisCount={realInDiagnosisCount}
        inProgressCount={realInProgressCount}
        newReceivedCount={realNewReceivedTodayCount}
        unassignedCount={realUnassignedCount}
        overdueCount={realOverdueCount}
        pendingInvoicesVal={realPendingInvoicesVal}
        lowStockCount={realLowStockCount}
      />

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'ADMIN' && (
          <>
            <StatCard type="totalTickets" value={totalTickets} />
            <StatCard type="inProgressTickets" value={inRepairTickets} />
            <StatCard type="readyPickup" value={readyPickupCount} />
            <StatCard type="resolvedTickets" value={completedTickets} />
          </>
        )}
        {role === 'TECHNICIAN' && (
          <>
            <StatCard type="tech_newReceived" value={myAssignedCount} />
            <StatCard type="tech_inProgress" value={myPendingRepairCount} />
            <StatCard type="tech_deliveredToday" value={myCompletedTodayCount} />
            <StatCard type="readyPickup" value={readyPickupCount} />
          </>
        )}
        {role === 'ADVISOR' && (
          <>
            <StatCard type="adv_readyPickup" value={readyPickupCount} />
            <StatCard type="adv_newReceived" value={advisorPendingApprovalCount} />
            <StatCard type="totalTickets" value={advisorCreatedCount} />
            <StatCard type="resolvedTickets" value={completedTickets} />
          </>
        )}
      </div>


    </div>
  );
};
