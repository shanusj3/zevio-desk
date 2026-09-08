import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Ticket,
  Users,
  Package,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Volume2,
  Plus,
  ArrowRight,
  IndianRupee
} from 'lucide-react';
import { reportsApi, TenantReports } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { ExportScopeModal, ExportScope } from '../components/ExportScopeModal';
import { ReportsSkeleton } from '../components/Skeleton';
import { formatCurrency as formatCurrencyUtil, formatDate, formatDateRange } from '../utils/formatters';
import { Pagination } from '../components/common/Pagination';

export type ReportTab = 'overview' | 'revenue' | 'tickets' | 'payments' | 'technicians' | 'inventory' | 'profitability';
export type TimeframeOption = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';

export interface TenantReportsViewProps {
  initialTab?: ReportTab;
}

export const TenantReportsView: React.FC<TenantReportsViewProps> = ({ initialTab }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab || 'overview');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    const p = location.pathname;
    if (p.includes('/reports/repairs')) {
      setActiveTab('tickets');
    } else if (p.includes('/reports/financials')) {
      setActiveTab('revenue');
    } else if (p.includes('/reports/inventory')) {
      setActiveTab('inventory');
    } else if (p.includes('/reports/highlights') || p === '/reports' || p === '/reports/') {
      setActiveTab('overview');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [location.pathname, initialTab]);

  const changeTab = (tab: ReportTab) => {
    setActiveTab(tab);
    if (tab === 'overview') navigate('/reports/highlights');
    else if (tab === 'tickets') navigate('/reports/repairs');
    else if (tab === 'revenue') navigate('/reports/financials');
    else if (tab === 'inventory') navigate('/reports/inventory');
  };
  const [timeframe, setTimeframe] = useState<TimeframeOption>('LAST_30_DAYS');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // Local calendar date values (YYYY-MM-DD)
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');
  const [prevPeriodStr, setPrevPeriodStr] = useState<string>('');

  const [paymentsPage, setPaymentsPage] = useState<number>(1);
  const paymentsLimit = 10;

  // Compute dates when timeframe changes
  useEffect(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    if (timeframe === 'TODAY') {
      start = new Date(now);
      end = new Date(now);
      prevStart = new Date(now);
      prevStart.setDate(now.getDate() - 1);
      prevEnd = new Date(prevStart);
    } else if (timeframe === 'YESTERDAY') {
      start = new Date(now);
      start.setDate(now.getDate() - 1);
      end = new Date(start);
      prevStart = new Date(now);
      prevStart.setDate(now.getDate() - 2);
      prevEnd = new Date(prevStart);
    } else if (timeframe === 'LAST_7_DAYS') {
      end = new Date(now);
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      prevEnd = new Date(start);
      prevEnd.setDate(start.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevEnd.getDate() - 6);
    } else if (timeframe === 'LAST_30_DAYS') {
      end = new Date(now);
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      prevEnd = new Date(start);
      prevEnd.setDate(start.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevEnd.getDate() - 29);
    } else if (timeframe === 'THIS_WEEK') {
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      end = new Date(now);
      prevEnd = new Date(start);
      prevEnd.setDate(start.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevEnd.getDate() - 6);
    } else if (timeframe === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (timeframe === 'LAST_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    } else if (timeframe === 'CUSTOM' && customStart && customEnd) {
      start = new Date(customStart);
      end = new Date(customEnd);
      const diffMs = end.getTime() - start.getTime();
      prevEnd = new Date(start.getTime() - 86400000);
      prevStart = new Date(prevEnd.getTime() - diffMs);
    }

    setStartDateStr(formatDate(start, { formatStyle: 'iso' }));
    setEndDateStr(formatDate(end, { formatStyle: 'iso' }));
    setPrevPeriodStr(formatDateRange(prevStart, prevEnd));
  }, [timeframe, customStart, customEnd]);

  // Query tenant report metrics from backend API
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tenant-reports', startDateStr, endDateStr, paymentsPage],
    queryFn: () => {
      if (!startDateStr || !endDateStr) return Promise.reject("Dates not set");
      return reportsApi.fetchTenantMetrics(startDateStr, endDateStr, paymentsPage, paymentsLimit);
    },
    enabled: !!startDateStr && !!endDateStr,
  });

  // Centralized currency formatting according to tenant's preferred currency style
  const formatCurrency = (val: number) => formatCurrencyUtil(val, { style: 'currency', maximumFractionDigits: 0 });

  // Comprehensive CSV Export utility for all report sub-pages
  const handleCSVExport = (scope: ExportScope = 'all') => {
    if (!data) {
      showToast("No report data available to export", "warning");
      return;
    }
    setIsExporting(true);
    showToast(`Downloading ${activeTab.toUpperCase()} report (${scope === 'all' ? 'All Data' : 'Filtered Scope'})...`, "info");
    
    try {
      let csvContent = "";
      csvContent += `ZevioDesk Analytics & Business Report (${activeTab.toUpperCase()})\n`;
      csvContent += `Period,${startDateStr} to ${endDateStr}\n`;
      csvContent += `Generated On,${new Date().toLocaleString()}\n\n`;

      if (activeTab === 'overview') {
        csvContent += `--- EXECUTIVE HIGHLIGHTS SUMMARY ---\n`;
        csvContent += `Metric,Value (INR / Count)\n`;
        csvContent += `Net Revenue Collected,${data.overview.netCollected}\n`;
        csvContent += `Gross Total Invoiced,${data.overview.invoicedAmount}\n`;
        csvContent += `Cash Collected,${data.overview.collectedAmount}\n`;
        csvContent += `Refunds Issued,${data.overview.refundedAmount}\n`;
        csvContent += `Period Outstanding,${data.overview.periodOutstanding}\n`;
        csvContent += `Cumulative Outstanding,${data.overview.cumulativeOutstanding}\n`;
        csvContent += `Overdue Amount,${data.overview.overdueAmount}\n`;
        csvContent += `Active Repair Pipeline Jobs,${data.overview.numTickets}\n`;
        csvContent += `Avg Repair Turnaround (Days),${data.overview.avgCompletionTimeDays || 0}\n\n`;

        csvContent += `--- TECHNICIAN PERFORMANCE LEADERBOARD ---\n`;
        csvContent += `Technician Name,Completed Jobs,Service Revenue (INR),Parts Value (INR),Avg Completion (Days)\n`;
        data.technicians.forEach(tech => {
          csvContent += `"${tech.name}",${tech.completed},${tech.serviceRevenue},${tech.partsValue},${tech.avgCompletionTime}\n`;
        });
      } else if (activeTab === 'tickets') {
        csvContent += `--- REPAIRS & TICKET ANALYTICS ---\n`;
        csvContent += `Total Repair Jobs,${data.tickets.totalTickets}\n`;
        csvContent += `Completed Repairs,${(data.tickets as any).completedTickets ?? (data.tickets.statusBreakdown?.find(s => s.name === 'DELIVERED' || s.name === 'COMPLETED' || s.name === 'REPAIRED')?.value || 0)}\n`;
        csvContent += `Avg Turnaround Hours (MTTR),${data.tickets.averageResolutionTime || 0} Hours\n\n`;

        csvContent += `Status Breakdown\nStatus,Count\n`;
        data.tickets.statusBreakdown.forEach(s => {
          csvContent += `"${s.name.replace(/_/g, ' ')}",${s.value}\n`;
        });

        csvContent += `\nTickets By Priority\nPriority,Count\n`;
        data.tickets.ticketsByPriority.forEach(p => {
          csvContent += `"${p.name}",${p.value}\n`;
        });

        csvContent += `\nTop Device Brands Serviced\nBrand,Count\n`;
        data.tickets.ticketsByBrand.forEach(b => {
          csvContent += `"${b.name}",${b.value}\n`;
        });
      } else if (activeTab === 'revenue' || activeTab === 'payments') {
        csvContent += `--- FINANCIALS & REVENUE ANALYTICS ---\n`;
        csvContent += `Gross Invoiced Amount,${data.revenue.totalInvoiced}\n`;
        csvContent += `Total Cash Collected,${data.revenue.totalCollected}\n`;
        csvContent += `Outstanding Balance,${data.revenue.outstanding}\n`;
        csvContent += `Refunded Amount,${data.revenue.refunded}\n\n`;

        csvContent += `Revenue By Payment Method\nMethod,Amount (INR)\n`;
        data.revenue.revenueByPaymentMethod.forEach(m => {
          csvContent += `"${m.name}",${m.value}\n`;
        });

        csvContent += `\nRevenue By Service Category\nCategory,Amount (INR)\n`;
        data.revenue.revenueByServiceType.forEach(c => {
          csvContent += `"${c.name}",${c.value}\n`;
        });
      } else if (activeTab === 'inventory') {
        csvContent += `--- INVENTORY & STOCK HEALTH ANALYTICS ---\n`;
        csvContent += `Total Stock Asset Valuation,${data.inventory.totalInventoryValue}\n`;
        csvContent += `Consumed Spare Parts Count,${data.inventory.partsConsumed}\n`;
        csvContent += `Total Parts Cost Billed,${data.inventory.partsCost}\n`;
        csvContent += `Low Stock Items Count,${data.inventory.lowStock?.length || 0}\n\n`;

        csvContent += `Low Stock Alerts\nItem Name,Current Stock,Min Stock Level\n`;
        (data.inventory.lowStock || []).forEach(item => {
          csvContent += `"${item.name}",${item.stock},${item.minStock}\n`;
        });

        csvContent += `\nTop Most Used Spare Parts\nPart Name,Quantity Used,Total Cost\n`;
        (data.inventory.mostUsedParts || []).forEach(item => {
          csvContent += `"${item.name}",${item.quantity},${item.totalCost}\n`;
        });
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ZevioReport_${activeTab.toUpperCase()}_${startDateStr}_${endDateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showToast("Failed to generate CSV export", "warning");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = () => {
    showToast("PDF report preview opening...", "success");
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 printing-layout">

      {/* Top Bar: Date Filter Dropdown & Comparison Label */}
      <div className="flex flex-wrap items-center gap-3 no-print">
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-white border border-[#116dff] hover:bg-[#f4f7ff] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1e293b] shadow-sm flex items-center gap-2 cursor-pointer outline-none transition-colors"
          >
            <Calendar className="w-4 h-4 text-[#116dff]" />
            <span>
              {timeframe === 'TODAY' && 'Today'}
              {timeframe === 'YESTERDAY' && 'Yesterday'}
              {timeframe === 'LAST_7_DAYS' && 'Last 7 days'}
              {timeframe === 'LAST_30_DAYS' && 'Last 30 days'}
              {timeframe === 'THIS_WEEK' && 'This week'}
              {timeframe === 'THIS_MONTH' && 'This month'}
              {timeframe === 'LAST_MONTH' && 'Last month'}
              {timeframe === 'CUSTOM' && 'Custom'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#116dff] transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Custom Dropdown Popover Menu using App Blue (#116dff) */}
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-[#dfe5eb] rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in duration-150">
                {[
                  { id: 'TODAY', label: 'Today' },
                  { id: 'YESTERDAY', label: 'Yesterday' },
                  { id: 'LAST_7_DAYS', label: 'Last 7 days' },
                  { id: 'LAST_30_DAYS', label: 'Last 30 days' },
                  { id: 'THIS_WEEK', label: 'This week' },
                  { id: 'THIS_MONTH', label: 'This month' },
                  { id: 'LAST_MONTH', label: 'Last month' },
                  { id: 'CUSTOM', label: 'Custom' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTimeframe(opt.id as TimeframeOption);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      timeframe === opt.id
                        ? 'bg-[#116dff] text-white'
                        : 'text-[#1e293b] hover:bg-[#f4f7ff] hover:text-[#116dff]'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {timeframe === 'CUSTOM' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 h-8 rounded-xl bg-white border border-[#116dff] text-[#1e293b] outline-none"
            />
            <span className="text-[#64748b]">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 h-8 rounded-xl bg-white border border-[#116dff] text-[#1e293b] outline-none"
            />
          </div>
        )}

        <span className="text-xs text-[#475569] font-medium">
          compared to previous period ({prevPeriodStr})
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="bg-[#116dff] hover:bg-[#0d5fd9] text-white rounded-xl px-4 py-2 text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Skeleton Page Loading State */}
      {isLoading && <ReportsSkeleton />}

      {isError && (
        <div className="bg-[#7F1D1D]/30 border border-[#EF4444]/20 p-8 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto" />
          <h4 className="text-sm font-bold text-white">Database Query Failure</h4>
          <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
            {error instanceof Error ? error.message : "Ensure parameters are within acceptable boundaries."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 border border-[#EF4444]/30 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Retry Query
          </button>
        </div>
      )}

      {/* Render Main Metrics Content */}
      {data && !isLoading && !isError && (
        <div className="space-y-6">

          {/* TAB 1: OVERVIEW */}
          {/* TAB 1: OVERVIEW / HIGHLIGHTS */}
          {activeTab === 'overview' && (() => {
            const lowStockCount = data.inventory?.lowStock?.length ?? 0;
            const totalInventoryVal = data.inventory?.totalInventoryValue ?? 0;
            const topPart = data.inventory?.mostUsedParts && data.inventory.mostUsedParts.length > 0 
              ? data.inventory.mostUsedParts[0] 
              : null;

            // Dynamic Payment Methods Split
            const paymentMethodsList = data.revenue?.revenueByPaymentMethod || data.payments?.byMethod || [];
            const totalPaymentAmt = paymentMethodsList.reduce((acc, m) => acc + (m.value || 0), 0);
            const paymentSplit = paymentMethodsList.map(m => ({
              name: m.name,
              pct: totalPaymentAmt > 0 ? Math.round((m.value / totalPaymentAmt) * 100) : 0,
            }));

            // Dynamic Overdue Jobs Count
            const overdueJobsCount = data.payments?.overdue ?? 0;

            // Dynamic Devices Serviced Breakdown
            const devicesList = data.tickets?.ticketsByCategory || data.tickets?.ticketsByBrand || [];
            const totalDeviceCount = devicesList.reduce((acc, d) => acc + (d.value || 0), 0);
            const deviceSplit = devicesList.map(d => ({
              name: d.name,
              pct: totalDeviceCount > 0 ? Math.round((d.value / totalDeviceCount) * 100) : 0,
            }));

            return (
              <div className="space-y-6 animate-in fade-in duration-200">

                {/* Outer Key Stats Card Container */}
                <div className="bg-white rounded-2xl p-5 border border-[#dfe5eb] space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#1e293b] tracking-tight">
                      Highlights Overview
                    </h2>
                    <span className="text-xs font-semibold text-[#94a3b8]">
                      Executive Summary
                    </span>
                  </div>

                  {/* Section 1: Top Executive KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* 1. Net Revenue Card */}
                    <div
                      onClick={() => changeTab('revenue')}
                      className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-medium text-[#4b5675] block">
                          Net Revenue
                        </span>
                        <div className="text-2xl font-bold text-[#1e293b] mt-1 tracking-tight">
                          {formatCurrency(data.overview.netCollected ?? 0)}
                        </div>
                      </div>
                      <div className="text-[11px] font-medium text-[#64748b] group-hover:text-[#1e293b] flex items-center gap-1 mt-2 transition-colors">
                        <span>View Financials</span>
                        <ArrowRight className="w-3 h-3 text-[#94a3b8] group-hover:text-[#1e293b] transition-colors" />
                      </div>
                    </div>

                    {/* 2. Active Repair Pipeline Card */}
                    <div
                      onClick={() => changeTab('tickets')}
                      className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-medium text-[#4b5675] block">
                          Active Pipeline
                        </span>
                        <div className="text-2xl font-bold text-[#1e293b] mt-1 tracking-tight">
                          {data.overview.numTickets ?? 0} Jobs
                        </div>
                      </div>
                      <div className="text-[11px] font-medium text-[#64748b] group-hover:text-[#1e293b] flex items-center gap-1 mt-2 transition-colors">
                        <span>View Repairs</span>
                        <ArrowRight className="w-3 h-3 text-[#94a3b8] group-hover:text-[#1e293b] transition-colors" />
                      </div>
                    </div>

                    {/* 3. Stock Health Card */}
                    <div
                      onClick={() => changeTab('inventory')}
                      className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#4b5675] block">
                            Stock Health
                          </span>
                          {lowStockCount > 0 ? (
                            <div className="flex items-center gap-1 text-[#d97706] bg-[#fffbe6] border border-[#fef08a] px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-[#d97706]" />
                              <span>Warning</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[#10b981] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <span>Optimal</span>
                            </div>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-[#1e293b] mt-1 tracking-tight">
                          {lowStockCount} Items Low
                        </div>
                      </div>
                      <div className="text-[11px] font-medium text-[#64748b] group-hover:text-[#1e293b] flex items-center gap-1 mt-2 transition-colors">
                        <span>View Stock</span>
                        <ArrowRight className="w-3 h-3 text-[#94a3b8] group-hover:text-[#1e293b] transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Financial Summary Highlights */}
                <div className="bg-white rounded-2xl p-5 border border-[#dfe5eb] space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#1e293b] tracking-tight">
                      Financial Summary Highlights
                    </h2>
                  </div>

                  {/* 3 Sub-cards in a ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-[#4b5675] block">Outstanding Receivables</span>
                        <span className="text-2xl font-bold text-[#1e293b] mt-1 block">
                          {formatCurrency(data.overview.cumulativeOutstanding ?? 0)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        (data.overview.cumulativeOutstanding ?? 0) > 0
                          ? "text-[#d97706] bg-[#fffbe6] border border-[#fef08a]"
                          : "text-[#10b981] bg-[#ecfdf5] border border-[#a7f3d0]"
                      }`}>
                        {(data.overview.cumulativeOutstanding ?? 0) > 0 ? "Unpaid" : "Settled"}
                      </span>
                    </div>

                    <div className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-[#4b5675] block">Avg Ticket Revenue (ATV)</span>
                        <span className="text-2xl font-bold text-[#1e293b] mt-1 block">
                          {formatCurrency(data.overview.avgRepairValue ?? 0)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#10b981] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full">
                        Healthy
                      </span>
                    </div>

                    <div className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-medium text-[#4b5675] block">Payment Method Split</span>
                      {paymentSplit.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-xs font-semibold text-[#4b5675] pt-0.5 flex-wrap gap-1">
                            {paymentSplit.slice(0, 3).map((item, idx) => (
                              <span key={idx} className={idx === 0 ? "text-[#116dff]" : idx === 1 ? "text-[#10b981]" : "text-[#a855f7]"}>
                                {item.name} {item.pct}%
                              </span>
                            ))}
                          </div>
                          <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden flex">
                            {paymentSplit.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className={`h-full ${idx === 0 ? "bg-[#bfdbfe]" : idx === 1 ? "bg-[#a7f3d0]" : "bg-[#e9d5ff]"}`}
                                style={{ width: `${item.pct}%` }}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-[#94a3b8] py-1">No payment transactions in range</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Repair Operations Quick Stats */}
                <div className="bg-white rounded-2xl p-5 border border-[#dfe5eb] space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#1e293b] tracking-tight">
                      Repair Operations Quick Stats
                    </h2>
                  </div>

                  {/* 3 Sub-cards in a ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-[#4b5675] block">Avg Turnaround Time (MTTR)</span>
                        <span className="text-2xl font-bold text-[#1e293b] mt-1 block">
                          {data.overview.avgCompletionTimeDays ?? 0} Days
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#10b981] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full">
                        Turnaround
                      </span>
                    </div>

                    <div className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-[#4b5675] block">Overdue Jobs Alert</span>
                        <span className="text-2xl font-bold text-[#1e293b] mt-1 block">
                          {overdueJobsCount} Overdue Jobs
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        overdueJobsCount > 0
                          ? "text-[#ef4444] bg-[#fef2f2] border border-[#fecaca]"
                          : "text-[#10b981] bg-[#ecfdf5] border border-[#a7f3d0]"
                      }`}>
                        {overdueJobsCount > 0 ? "Critical" : "On Schedule"}
                      </span>
                    </div>

                    <div className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-medium text-[#4b5675] block">Device Serviced Breakdown</span>
                      {deviceSplit.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-xs font-semibold text-[#4b5675] pt-0.5 flex-wrap gap-1">
                            {deviceSplit.slice(0, 3).map((item, idx) => (
                              <span key={idx}>
                                {item.name} {item.pct}%
                              </span>
                            ))}
                          </div>
                          <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden flex">
                            {deviceSplit.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className={`h-full ${idx === 0 ? "bg-[#a5f3fc]" : idx === 1 ? "bg-[#bfdbfe]" : "bg-[#e2e8f0]"}`}
                                style={{ width: `${item.pct}%` }}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-[#94a3b8] py-1">No repair data in range</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Inventory Quick Summary */}
                <div className="bg-white rounded-2xl p-5 border border-[#dfe5eb] space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#1e293b] tracking-tight">
                      Inventory Quick Summary
                    </h2>
                  </div>

                  {/* 3 Sub-cards in a ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-[#4b5675] block">Total Inventory Valuation</span>
                        <span className="text-2xl font-bold text-[#1e293b] mt-1 block">
                          {formatCurrency(totalInventoryVal)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] border border-[#ddd6fe] px-2.5 py-0.5 rounded-full">
                        Asset Stock
                      </span>
                    </div>

                    <div className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-[#4b5675] block">Top Consumed Spare Part</span>
                        <span className="text-xs font-bold text-[#1e293b] mt-1 block truncate max-w-[150px]">
                          {topPart ? topPart.name : "None"}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#475569] bg-[#e2e8f0] px-2 py-0.5 rounded-full">
                        {topPart ? `${topPart.quantity}x` : "0x"}
                      </span>
                    </div>

                    <div className="bg-white border border-[#dfe5eb] hover:bg-[#f4f7ff] transition-colors duration-150 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-[#4b5675] block">Est. Gross Margin</span>
                        <span className="text-2xl font-bold text-[#1e293b] mt-1 block">
                          {data.overview.grossMarginPercent ?? 0}%
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#10b981] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full">
                        Profitable
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* TAB 2: REVENUE / FINANCIALS */}
          {activeTab === 'revenue' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Financial KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#dfe5eb] p-4 rounded-xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Gross Invoiced</span>
                  <div className="text-xl font-bold text-[#1e293b] mt-1">{formatCurrency(data.revenue.totalInvoiced)}</div>
                </div>
                <div className="bg-white border border-[#dfe5eb] p-4 rounded-xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Total Cash Collected</span>
                  <div className="text-xl font-bold text-[#10b981] mt-1">{formatCurrency(data.revenue.totalCollected)}</div>
                </div>
                <div className="bg-white border border-[#dfe5eb] p-4 rounded-xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Currently Outstanding</span>
                  <div className="text-xl font-bold text-[#d97706] mt-1">{formatCurrency(data.revenue.outstanding)}</div>
                </div>
                <div className="bg-white border border-[#dfe5eb] p-4 rounded-xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Refunded Amount</span>
                  <div className="text-xl font-bold text-[#ef4444] mt-1">{formatCurrency(data.revenue.refunded)}</div>
                </div>
              </div>

              {/* Revenue Daily Trend Chart */}
              <div className="bg-white border border-[#dfe5eb] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-[#4b5675] uppercase tracking-wider">Revenue Trend (Cash Collected)</h3>

                {data.revenue.revenueByPeriod.length === 0 ? (
                  <p className="text-xs text-[#94a3b8] text-center py-10">No payments collected in this range.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="h-40 flex items-end justify-between gap-1.5 pt-6 border-b border-[#dfe5eb]">
                      {data.revenue.revenueByPeriod.map((pt, idx) => {
                        const maxVal = Math.max(...data.revenue.revenueByPeriod.map(p => p.amount), 1000);
                        const heightPct = (pt.amount / maxVal) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                            <div className="w-full bg-[#f1f5f9] rounded-t relative h-32 flex items-end">
                              <div
                                className="w-full bg-gradient-to-t from-[#116dff] to-[#3b82f6] rounded-t transition duration-200 group-hover:brightness-110"
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1e293b] border border-[#334155] px-2 py-1 rounded text-[9px] font-mono text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 shadow-lg">
                              {pt.date}: {formatCurrency(pt.amount)}
                            </div>
                            <span className="text-[8px] text-[#64748b] font-mono mt-1 select-none">
                              {pt.date.slice(8, 10)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-[#64748b] font-mono text-center">Daily trend map (Horizontal axis indicates calendar day of month)</p>
                  </div>
                )}
              </div>

              {/* Revenue Splits */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-[#dfe5eb] p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-[#4b5675] uppercase">Revenue by Category</h4>
                  <div className="space-y-2 text-xs">
                    {data.revenue.revenueByServiceType.length === 0 ? (
                      <p className="text-[#94a3b8] py-6 text-center">No categories recorded.</p>
                    ) : (
                      data.revenue.revenueByServiceType.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-[#dfe5eb]">
                          <span className="text-[#1e293b] font-medium">{item.name}</span>
                          <span className="font-bold text-[#1e293b] font-mono">{formatCurrency(item.value)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#dfe5eb] p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-[#4b5675] uppercase">Revenue by Payment Method</h4>
                  <div className="space-y-2 text-xs">
                    {data.revenue.revenueByPaymentMethod.length === 0 ? (
                      <p className="text-[#94a3b8] py-6 text-center">No payments logged.</p>
                    ) : (
                      data.revenue.revenueByPaymentMethod.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-[#dfe5eb]">
                          <span className="text-[#1e293b] font-medium">{item.name}</span>
                          <span className="font-bold text-[#10b981] font-mono">{formatCurrency(item.value)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#dfe5eb] p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-[#4b5675] uppercase">Revenue by Technician</h4>
                  <div className="space-y-2 text-xs">
                    {data.revenue.revenueByTechnician.length === 0 ? (
                      <p className="text-[#94a3b8] py-6 text-center">No technician records.</p>
                    ) : (
                      data.revenue.revenueByTechnician.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-[#dfe5eb]">
                          <span className="text-[#1e293b] font-medium">{item.name}</span>
                          <span className="font-bold text-[#1e293b] font-mono">{formatCurrency(item.value)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TICKETS / REPAIRS */}
          {activeTab === 'tickets' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Total Repair Jobs</span>
                  <div className="text-2xl font-black text-[#1e293b] mt-1">{data.tickets.totalTickets} Jobs</div>
                  <p className="text-[10px] text-[#94a3b8] mt-1">Logged in selected period</p>
                </div>
                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Completed Repairs</span>
                  <div className="text-2xl font-black text-[#10b981] mt-1">{(data.tickets as any).completedTickets ?? (data.tickets.statusBreakdown?.find(s => s.name === 'DELIVERED' || s.name === 'COMPLETED' || s.name === 'REPAIRED')?.value || 0)} Jobs</div>
                  <p className="text-[10px] text-[#94a3b8] mt-1">Successfully repaired</p>
                </div>
                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Avg Turnaround Time</span>
                  <div className="text-2xl font-black text-[#116dff] mt-1">{data.tickets.averageResolutionTime || 0} Hours</div>
                  <p className="text-[10px] text-[#94a3b8] mt-1">From intake to repair ready</p>
                </div>
              </div>

              <div className="bg-white border border-[#dfe5eb] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-[#4b5675] uppercase tracking-wider">Ticket Lifecycle Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {data.tickets.statusBreakdown.map((item, idx) => (
                    <div key={idx} className="bg-[#f8fafc] p-3.5 rounded-xl border border-[#e2e8f0] text-center">
                      <div className="text-[10px] text-[#64748b] font-bold uppercase truncate" title={item.name}>
                        {item.name.replace(/_/g, ' ')}
                      </div>
                      <div className="text-lg font-extrabold text-[#1e293b] mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Splits grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-[#4b5675] uppercase">Tickets by Priority</h4>
                  <div className="space-y-2 text-xs">
                    {data.tickets.ticketsByPriority.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-[#dfe5eb]">
                        <span className="text-[#1e293b]">{item.name}</span>
                        <span className="font-bold text-[#1e293b]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-[#4b5675] uppercase">Tickets by Brand</h4>
                  <div className="space-y-2 text-xs">
                    {data.tickets.ticketsByBrand.length === 0 ? (
                      <p className="text-[#94a3b8] py-6 text-center">No brands logged.</p>
                    ) : (
                      data.tickets.ticketsByBrand.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-[#dfe5eb]">
                          <span className="text-[#1e293b]">{item.name}</span>
                          <span className="font-bold text-[#1e293b]">{item.value}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-[#4b5675] uppercase">Tickets by Device Category</h4>
                  <div className="space-y-2 text-xs">
                    {data.tickets.ticketsByCategory.length === 0 ? (
                      <p className="text-[#94a3b8] py-6 text-center">No categories logged.</p>
                    ) : (
                      data.tickets.ticketsByCategory.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-[#dfe5eb]">
                          <span className="text-[#1e293b]">{item.name}</span>
                          <span className="font-bold text-[#1e293b]">{item.value}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Total Cash Collected</span>
                  <div className="text-2xl font-black text-[#10b981] mt-1">{formatCurrency(data.payments.totalCollected)}</div>
                  <p className="text-[10px] text-[#94a3b8] mt-1">Inflow within selected range</p>
                </div>
                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Total Refunds</span>
                  <div className="text-2xl font-black text-[#ef4444] mt-1">{formatCurrency(data.payments.refunds)}</div>
                  <p className="text-[10px] text-[#94a3b8] mt-1">Refunds paid back in range</p>
                </div>
                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Net Cash Flow</span>
                  <div className="text-2xl font-black text-[#1e293b] mt-1">{formatCurrency(data.payments.netCollected)}</div>
                  <p className="text-[10px] text-[#94a3b8] mt-1">Collected minus refunded</p>
                </div>
              </div>

              {/* Outstanding Payments Table */}
              <div className="bg-white border border-[#dfe5eb] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#4b5675] uppercase tracking-wider">Outstanding Invoices</h3>
                  <span className="text-[11px] text-[#94a3b8]">
                    Showing {data.payments.outstandingList.length} of {data.payments.pagination.total} outstanding bills
                  </span>
                </div>

                <div className="border border-[#dfe5eb] rounded-xl overflow-hidden text-xs">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#f8fafc] text-[#4b5675] font-bold">
                      <tr className="border-b border-[#dfe5eb]">
                        <th className="px-4 py-3 text-left">Invoice No</th>
                        <th className="px-4 py-3 text-left">Customer Name</th>
                        <th className="px-4 py-3 text-right">Due Date</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dfe5eb] text-[#1e293b]">
                      {data.payments.outstandingList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-[#94a3b8]">
                            No outstanding invoices logged at this time!
                          </td>
                        </tr>
                      ) : (
                        data.payments.outstandingList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#f8fafc]">
                            <td className="px-4 py-3 font-mono font-bold text-[#1e293b]">{item.invoiceNumber}</td>
                            <td className="px-4 py-3">{item.customerName}</td>
                            <td className="px-4 py-3 text-right font-mono">{item.dueDate}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'OVERDUE'
                                ? 'bg-[#fef2f2] text-[#ef4444] border border-[#fecaca]'
                                : 'bg-[#fffbe6] text-[#d97706] border border-[#fef08a]'
                                }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[#1e293b] font-bold">
                              {formatCurrency(item.dueAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={data.payments.pagination.page}
                  totalPages={data.payments.pagination.totalPages}
                  totalItems={data.payments.pagination.total}
                  pageSize={10}
                  onPageChange={setPaymentsPage}
                  showingLabel="bills"
                />
              </div>
            </div>
          )}

          {/* TAB 5: TECHNICIANS */}
          {activeTab === 'technicians' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white border border-[#dfe5eb] rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-[#4b5675] uppercase tracking-wider">Technician Workload &amp; Service Earnings</h3>
                <div className="border border-[#dfe5eb] rounded-xl overflow-hidden text-xs">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#f8fafc] text-[#4b5675] font-bold">
                      <tr className="border-b border-[#dfe5eb]">
                        <th className="px-4 py-3 text-left">Technician Name</th>
                        <th className="px-4 py-3 text-center">Jobs Assigned</th>
                        <th className="px-4 py-3 text-center">Jobs Completed</th>
                        <th className="px-4 py-3 text-center">Active / Pending</th>
                        <th className="px-4 py-3 text-right">Avg completion time</th>
                        <th className="px-4 py-3 text-right">Service Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dfe5eb] text-[#1e293b]">
                      {data.technicians.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-[#94a3b8]">
                            No technician accounts setup for this store.
                          </td>
                        </tr>
                      ) : (
                        data.technicians.map((tech, idx) => (
                          <tr key={idx} className="hover:bg-[#f8fafc]">
                            <td className="px-4 py-3 text-[#1e293b] font-bold">{tech.name}</td>
                            <td className="px-4 py-3 text-center font-mono">{tech.assigned}</td>
                            <td className="px-4 py-3 text-center font-mono text-[#10b981] font-bold">{tech.completed}</td>
                            <td className="px-4 py-3 text-center font-mono text-[#d97706]">{tech.pending}</td>
                            <td className="px-4 py-3 text-right font-mono">{tech.avgCompletionTime} days</td>
                            <td className="px-4 py-3 text-right font-mono text-[#1e293b] font-extrabold">
                              {formatCurrency(tech.serviceRevenue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Total Stock Asset Valuation</span>
                  <div className="text-2xl font-black text-[#7c3aed] mt-1">{formatCurrency(data.inventory.totalInventoryValue)}</div>
                  <p className="text-[10px] text-[#94a3b8] mt-1">Total catalog stock value estimate</p>
                </div>
                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Parts Consumed</span>
                  <div className="text-2xl font-black text-[#1e293b] mt-1">{data.inventory.partsConsumed} units</div>
                  <p className="text-[10px] text-[#94a3b8] mt-1">Spares consumed in repairs</p>
                </div>
                <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-[#4b5675] uppercase font-bold">Total Parts Billed Charge</span>
                  <div className="text-2xl font-black text-[#10b981] mt-1">{formatCurrency(data.inventory.partsCost)}</div>
                  <p className="text-[10px] text-[#94a3b8] mt-1">Sum value billed to clients</p>
                </div>
              </div>

              {/* Grid split: Top parts vs low stock */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-[#dfe5eb] p-6 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-[#4b5675] uppercase tracking-wider">Top 10 Most Used Spare Parts</h3>
                  <div className="border border-[#dfe5eb] rounded-xl overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-[#f8fafc] text-[#4b5675] font-bold">
                        <tr className="border-b border-[#dfe5eb]">
                          <th className="px-4 py-2.5 text-left">Part Name</th>
                          <th className="px-4 py-2.5 text-center">Qty Consumed</th>
                          <th className="px-4 py-2.5 text-right">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dfe5eb] text-[#1e293b]">
                        {(data.inventory.mostUsedParts || []).length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-[#94a3b8]">
                              No parts consumption data recorded.
                            </td>
                          </tr>
                        ) : (
                          data.inventory.mostUsedParts.map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#f8fafc]">
                              <td className="px-4 py-2.5 font-medium">{item.name}</td>
                              <td className="px-4 py-2.5 text-center font-mono font-bold">{item.quantity}</td>
                              <td className="px-4 py-2.5 text-right font-mono font-bold text-[#10b981]">{formatCurrency(item.totalCost)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white border border-[#dfe5eb] p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#4b5675] uppercase tracking-wider">Low Stock Warning Alerts</h3>
                    <span className="text-[10px] font-bold text-[#d97706] bg-[#fffbe6] border border-[#fef08a] px-2 py-0.5 rounded-full">
                      {(data.inventory.lowStock || []).length} Alert Items
                    </span>
                  </div>
                  <div className="border border-[#dfe5eb] rounded-xl overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-[#f8fafc] text-[#4b5675] font-bold">
                        <tr className="border-b border-[#dfe5eb]">
                          <th className="px-4 py-2.5 text-left">Item Name</th>
                          <th className="px-4 py-2.5 text-center">Stock</th>
                          <th className="px-4 py-2.5 text-right">Min Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dfe5eb] text-[#1e293b]">
                        {(data.inventory.lowStock || []).length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-[#10b981] font-medium">
                              Optimal! All inventory items have healthy stock levels.
                            </td>
                          </tr>
                        ) : (
                          data.inventory.lowStock.map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#f8fafc]">
                              <td className="px-4 py-2.5 font-medium">{item.name}</td>
                              <td className="px-4 py-2.5 text-center font-mono font-bold text-[#ef4444]">{item.stock}</td>
                              <td className="px-4 py-2.5 text-right font-mono text-[#64748b]">{item.minStock}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PROFITABILITY */}
          {activeTab === 'profitability' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Profitability summary values */}
              <div className="bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Estimated Gross Profit &amp; Margin</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${data.profitability.profitabilityStatus === 'FULL'
                    ? 'bg-emerald-950/40 text-[#34D399] border border-emerald-800/30'
                    : data.profitability.profitabilityStatus === 'CONTRIBUTION'
                      ? 'bg-amber-950/40 text-[#F59E0B] border border-amber-800/30'
                      : 'bg-red-950/40 text-red-400 border border-red-800/30'
                    }`}>
                    Classification: {data.profitability.profitabilityStatus}
                  </span>
                </div>

                {data.profitability.profitabilityStatus === 'UNAVAILABLE' ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-xs space-y-2 text-[#9CA3AF]">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p className="font-bold text-white text-sm">Profitability unavailable</p>
                    <p className="max-w-md">Parts Cost and Labor Cost data are both missing for finalized tickets in this range. Profitability cannot be computed.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Big Gauge layout */}
                    <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-[#182030]/50 border border-[#2d3b54] rounded-2xl">
                      <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wide">
                        {data.profitability.profitabilityStatus === 'FULL' ? 'Gross Margin' : 'Contribution Margin'}
                      </span>
                      <div className="text-4xl font-black text-[#D99B26] mt-1.5 font-mono">{data.profitability.grossMarginPercent}%</div>
                      <p className="text-[10px] text-[#9CA3AF] text-center mt-2.5 max-w-[180px]">
                        {data.profitability.profitabilityStatus === 'FULL'
                          ? 'Net efficiency ratio taking spares cost and labor wages into account.'
                          : 'Approximation excluding missing technician labor wage inputs.'}
                      </p>
                    </div>

                    {/* Breakdown spreadsheet */}
                    <div className="lg:col-span-8 divide-y divide-[#1f293d] text-xs">
                      <div className="flex justify-between py-2.5 font-bold">
                        <span className="text-[#9CA3AF]">Total Invoiced Revenue (excl. Tax)</span>
                        <span className="text-white font-mono">{formatCurrency(data.profitability.invoiceSubtotal)}</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className="text-[#9CA3AF]">Parts Revenue Charged to Clients</span>
                        <span className="text-white font-mono">{formatCurrency(data.profitability.partsRevenue)}</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className="text-[#9CA3AF]">Service/Labor Revenue Charged to Clients</span>
                        <span className="text-white font-mono">{formatCurrency(data.profitability.serviceRevenue)}</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className="text-[#9CA3AF]">Parts Acquisition Cost (Spares Cost)</span>
                        <span className="text-red-400 font-mono">-{formatCurrency(data.profitability.partsCost)}</span>
                      </div>
                      {data.profitability.profitabilityStatus === 'FULL' && (
                        <div className="flex justify-between py-2.5">
                          <span className="text-[#9CA3AF]">Labor Wages Cost (Technician Payouts)</span>
                          <span className="text-red-400 font-mono">-{formatCurrency(data.profitability.laborCost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-3 font-extrabold text-sm border-t border-[#1f293d] pt-3">
                        <span className="text-[#34D399]">
                          {data.profitability.profitabilityStatus === 'FULL' ? 'Estimated Gross Profit' : 'Estimated Contribution'}
                        </span>
                        <span className="text-[#34D399] font-mono">
                          {formatCurrency(
                            data.profitability.profitabilityStatus === 'FULL'
                              ? data.profitability.grossProfit
                              : data.profitability.estimatedContribution
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Splits grids */}
              {data.profitability.profitabilityStatus !== 'UNAVAILABLE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Profitability by brand */}
                  <div className="bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-[#9CA3AF] uppercase">Profitability by Device Brand</h4>

                    <div className="border border-[#1f293d] rounded-xl overflow-hidden text-xs">
                      <table className="w-full">
                        <thead className="bg-[#182030] text-[#9CA3AF] font-bold">
                          <tr className="border-b border-[#1f293d]">
                            <th className="px-4 py-2 text-left">Brand</th>
                            <th className="px-4 py-2 text-right">Revenue</th>
                            <th className="px-4 py-2 text-right">Estimated Profit</th>
                            <th className="px-4 py-2 text-right">Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f293d] text-[#CBD5E1]">
                          {data.profitability.profitabilityByBrand.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-4 text-center text-[#9CA3AF]">
                                No brand breakdown available.
                              </td>
                            </tr>
                          ) : (
                            data.profitability.profitabilityByBrand.map((item, idx) => (
                              <tr key={idx} className="hover:bg-[#182030]/50">
                                <td className="px-4 py-2.5 font-bold text-white">{item.name}</td>
                                <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(item.revenue)}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-[#34D399] font-bold">{formatCurrency(item.profit)}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-[#D99B26] font-bold">{item.margin}%</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Profitability by category */}
                  <div className="bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-[#9CA3AF] uppercase">Profitability by Service Category</h4>

                    <div className="border border-[#1f293d] rounded-xl overflow-hidden text-xs">
                      <table className="w-full">
                        <thead className="bg-[#182030] text-[#9CA3AF] font-bold">
                          <tr className="border-b border-[#1f293d]">
                            <th className="px-4 py-2 text-left">Category</th>
                            <th className="px-4 py-2 text-right">Revenue</th>
                            <th className="px-4 py-2 text-right">Estimated Profit</th>
                            <th className="px-4 py-2 text-right">Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f293d] text-[#CBD5E1]">
                          {data.profitability.profitabilityByCategory.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-4 text-center text-[#9CA3AF]">
                                No category breakdown available.
                              </td>
                            </tr>
                          ) : (
                            data.profitability.profitabilityByCategory.map((item, idx) => (
                              <tr key={idx} className="hover:bg-[#182030]/50">
                                <td className="px-4 py-2.5 font-bold text-white">{item.name}</td>
                                <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(item.revenue)}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-[#34D399] font-bold">{formatCurrency(item.profit)}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-[#D99B26] font-bold">{item.margin}%</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* Export Scope Modal */}
      <ExportScopeModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={(scope) => {
          handleCSVExport(scope);
          setIsExportModalOpen(false);
        }}
        allCount={data?.tickets?.totalTickets || 100}
        filteredCount={data?.tickets?.totalTickets || 100}
        isExporting={isExporting}
      />
    </div>
  );
};

