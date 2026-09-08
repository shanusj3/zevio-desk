import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { TicketsTable } from '../components/TicketsTable';
import { Ticket, FetchTicketsParams, ticketsApi } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { downloadCsv } from '../lib/csvExport';

export const TicketsTab: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useAppStore();
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHeaderOut, setIsHeaderOut] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FetchTicketsParams>({});

  const handleExportTickets = async (scope: 'all' | 'filtered') => {
    try {
      const exportParams = scope === 'filtered' ? activeFilters : {};
      const tickets = await ticketsApi.fetchAll(exportParams);
      if (tickets.length === 0) {
        showToast('No tickets available to export', 'warning');
        return;
      }

      const headers = ['Ticket #', 'Job #', 'Customer', 'Device', 'Brand', 'Status', 'Priority', 'Estimated Cost', 'Created At'];
      const rows = tickets.map((t) => [
        t.ticketNumber || t.id,
        t.jobNumber || '',
        t.customer?.name || '',
        t.itemCategory || t.model || '',
        t.brand || '',
        t.status || 'RECEIVED',
        t.priority || 'NORMAL',
        String(t.estimatedCost || 0),
        t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
      ]);

      downloadCsv(`tickets_export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      showToast(`Exported ${rows.length} tickets to CSV`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export tickets', 'warning');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Repair Tickets"
        count={totalCount}
        subtitle="Manage workshop repair tickets, diagnostic quotes, and pickup status"
        primaryAction={{
          label: 'New Ticket',
          onClick: () => navigate('/tickets/new'),
        }}
        exportConfig={{
          allCount: totalCount,
          filteredCount: filteredCount,
          exportTitle: 'Export Repair Tickets',
          exportDescription: 'Your repair tickets list will be downloaded as a CSV file.',
          onExport: handleExportTickets,
        }}
        isExportModalOpen={isExportModalOpen}
        onExportModalOpenChange={setIsExportModalOpen}
        onHeaderOutChange={setIsHeaderOut}
      />

      <TicketsTable
        isHeaderOut={isHeaderOut}
        onSelectTicket={(ticket: Ticket) => navigate(`/tickets/${ticket.id}`)}
        onExportClick={() => setIsExportModalOpen(true)}
        onTotalCountChange={setTotalCount}
        onFilteredCountChange={setFilteredCount}
        onFiltersChange={setActiveFilters}
      />
    </div>
  );
};
