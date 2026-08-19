import React, { useState, useEffect } from 'react';
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
  Download, 
  Calendar,
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { reportsApi, TenantReports } from '../lib/api';
import { useAppStore } from '../store/useAppStore';

type ReportTab = 'overview' | 'revenue' | 'tickets' | 'payments' | 'technicians' | 'inventory' | 'profitability';
type TimeframeOption = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';

export const TenantReportsView: React.FC = () => {
  const { showToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('THIS_MONTH');
  
  // Local calendar date values (YYYY-MM-DD)
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');
  
  const [paymentsPage, setPaymentsPage] = useState<number>(1);
  const paymentsLimit = 10;

  // Format helper for calendar date YYYY-MM-DD
  const formatDateLocal = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Compute dates when timeframe changes
  useEffect(() => {
    const now = new Date();
    if (timeframe === 'TODAY') {
      const todayStr = formatDateLocal(now);
      setStartDateStr(todayStr);
      setEndDateStr(todayStr);
    } else if (timeframe === 'THIS_WEEK') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); // start of week
      setStartDateStr(formatDateLocal(start));
      setEndDateStr(formatDateLocal(now));
    } else if (timeframe === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDateStr(formatDateLocal(start));
      setEndDateStr(formatDateLocal(now));
    } else if (timeframe === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month
      setStartDateStr(formatDateLocal(start));
      setEndDateStr(formatDateLocal(end));
    } else if (timeframe === 'CUSTOM' && customStart && customEnd) {
      setStartDateStr(customStart);
      setEndDateStr(customEnd);
    }
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

  // Currency helper formatting according to tenant's preferred currency style
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // CSV Export utility
  const handleCSVExport = () => {
    showToast("Preparing CSV report download...", "info");
    // Generate a simple CSV file dynamically
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Report,Zeviodesk Analytics\n`;
    csvContent += `Period,${startDateStr} to ${endDateStr}\n\n`;
    
    if (activeTab === 'overview') {
      csvContent += `Metric,Value\n`;
      csvContent += `Total Invoiced,${data.overview.invoicedAmount}\n`;
      csvContent += `Payments Collected,${data.overview.collectedAmount}\n`;
      csvContent += `Refunds,${data.overview.refundedAmount}\n`;
      csvContent += `Net Collected,${data.overview.netCollected}\n`;
      csvContent += `Period Outstanding,${data.overview.periodOutstanding}\n`;
      csvContent += `Cumulative Outstanding,${data.overview.cumulativeOutstanding}\n`;
      csvContent += `Overdue Amount,${data.overview.overdueAmount}\n`;
    } else if (activeTab === 'technicians') {
      csvContent += `Technician,Completed,Service Revenue,Parts Value,Avg completion (Days)\n`;
      data.technicians.forEach(tech => {
        csvContent += `"${tech.name}",${tech.completed},${tech.serviceRevenue},${tech.partsValue},${tech.avgCompletionTime}\n`;
      });
    } else {
      csvContent += `Tab data export is currently in draft. Complete PDF/CSV reports will download in V2.\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZevioReport_${activeTab}_${startDateStr}_${endDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePDFExport = () => {
    showToast("PDF report preview opening...", "success");
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 printing-layout">
      {/* Date selector and timeframe selection top-bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow-xl no-print">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D99B26]" />
            Business Reports &amp; Analytics
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Monitor invoices, cash flows, technician resolution speeds, and inventory profitability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe choices */}
          <div className="flex items-center bg-[#182030] border border-[#2d3b54] p-1 rounded-xl text-xs font-semibold text-[#9CA3AF]">
            {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'CUSTOM'] as TimeframeOption[]).map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setTimeframe(opt);
                  setPaymentsPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === opt
                    ? 'bg-[#D99B26] text-[#0d121c] font-extrabold shadow'
                    : 'hover:text-white cursor-pointer'
                }`}
              >
                {opt === 'TODAY' && 'Today'}
                {opt === 'THIS_WEEK' && 'Week'}
                {opt === 'THIS_MONTH' && 'Month'}
                {opt === 'LAST_MONTH' && 'Last Month'}
                {opt === 'CUSTOM' && 'Custom'}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {timeframe === 'CUSTOM' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 h-8 rounded-lg bg-[#182030] border border-[#2d3b54] text-white outline-none focus:border-[#D99B26]"
              />
              <span className="text-[#6B7280]">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 h-8 rounded-lg bg-[#182030] border border-[#2d3b54] text-white outline-none focus:border-[#D99B26]"
              />
            </div>
          )}

          {/* Export Choices */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCSVExport}
              disabled={!data}
              className="px-3.5 h-9 bg-[#182030] hover:bg-[#202c40] text-[#CBD5E1] border border-[#2d3b54] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#D99B26]" />
              CSV
            </button>
            <button
              onClick={handlePDFExport}
              disabled={!data}
              className="px-3.5 h-9 bg-[#182030] hover:bg-[#202c40] text-[#CBD5E1] border border-[#2d3b54] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#D99B26]" />
              PDF / Print
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Tab Selection */}
      <div className="flex gap-1 border-b border-[#1f293d] overflow-x-auto pb-px no-print">
        {([
          { id: 'overview', label: 'Overview', icon: Briefcase },
          { id: 'revenue', label: 'Revenue', icon: TrendingUp },
          { id: 'tickets', label: 'Tickets', icon: Ticket },
          { id: 'payments', label: 'Payments', icon: DollarSign },
          { id: 'technicians', label: 'Technicians', icon: Users },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'profitability', label: 'Profitability', icon: BarChart3 },
        ] as { id: ReportTab; label: string; icon: any }[]).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition shrink-0 outline-none focus:outline-none ${
                isActive
                  ? 'border-[#D99B26] text-[#D99B26]'
                  : 'border-transparent text-[#9CA3AF] hover:text-white hover:border-[#2d3b54]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Page states */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111827] border border-[#1f293d] rounded-2xl space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#D99B26]" />
          <p className="text-xs text-[#9CA3AF] font-medium">Analyzing database records...</p>
        </div>
      )}

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
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Top Key Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow-lg relative overflow-hidden">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF]">Invoiced Amount</span>
                  <div className="text-2xl font-black text-white mt-1">{formatCurrency(data.overview.invoicedAmount)}</div>
                  <span className="text-[10px] text-[#9CA3AF] block mt-1">Finalized in period (excl. tax)</span>
                </div>
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow-lg relative overflow-hidden">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#34D399]">Collected Amount</span>
                  <div className="text-2xl font-black text-[#34D399] mt-1">{formatCurrency(data.overview.collectedAmount)}</div>
                  <span className="text-[10px] text-[#9CA3AF] block mt-1">Cash/UPI payments collected</span>
                </div>
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow-lg relative overflow-hidden">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#F59E0B]">Current Outstanding</span>
                  <div className="text-2xl font-black text-[#F59E0B] mt-1">{formatCurrency(data.overview.cumulativeOutstanding)}</div>
                  <span className="text-[10px] text-[#9CA3AF] block mt-1">All outstanding invoices ever</span>
                </div>
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow-lg relative overflow-hidden text-red-400">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-red-400/80">Overdue (Past Due)</span>
                  <div className="text-2xl font-black mt-1 text-red-400">{formatCurrency(data.overview.overdueAmount)}</div>
                  <span className="text-[10px] text-[#9CA3AF] block mt-1">Unpaid invoices past due date</span>
                </div>
              </div>

              {/* Grid 2: Ticketing metrics + financial margins */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Ticketing stats */}
                <div className="lg:col-span-6 bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Ticketing Performance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#182030] p-4 rounded-xl text-center border border-[#2d3b54]">
                      <div className="text-xs text-[#9CA3AF]">Tickets Created</div>
                      <div className="text-2xl font-black text-white mt-1">{data.overview.numTickets}</div>
                    </div>
                    <div className="bg-[#182030] p-4 rounded-xl text-center border border-[#2d3b54]">
                      <div className="text-xs text-[#9CA3AF]">Completed</div>
                      <div className="text-2xl font-black text-[#34D399] mt-1">{data.overview.completedTickets}</div>
                    </div>
                    <div className="bg-[#182030] p-4 rounded-xl text-center border border-[#2d3b54]">
                      <div className="text-xs text-[#9CA3AF]">Ready for Collection</div>
                      <div className="text-2xl font-black text-[#F59E0B] mt-1">{data.overview.readyForPickupTickets}</div>
                    </div>
                  </div>

                  <div className="divide-y divide-[#1f293d] text-xs pt-2">
                    <div className="flex justify-between py-2.5">
                      <span className="text-[#9CA3AF]">Average Repair Value (AOV)</span>
                      <span className="font-bold text-white font-mono">{formatCurrency(data.overview.avgRepairValue)}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-[#9CA3AF]">Average Completion Time</span>
                      <span className="font-bold text-white font-mono">{data.overview.avgCompletionTimeDays} days</span>
                    </div>
                  </div>
                </div>

                {/* Economic Profitability Margins */}
                <div className="lg:col-span-6 bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Estimated Profitability</h3>
                  
                  {data.overview.profitabilityStatus === 'UNAVAILABLE' ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-xs space-y-2 text-[#9CA3AF]">
                      <AlertCircle className="w-8 h-8 text-[#F59E0B]" />
                      <p className="font-bold text-white">Profitability unavailable</p>
                      <p className="text-[11px]">Cost data is incomplete for this timeframe.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-[#9CA3AF]">
                            {data.overview.profitabilityStatus === 'FULL' ? 'Estimated Gross Profit' : 'Estimated Contribution'}
                          </span>
                          <span className="font-black text-white font-mono">{formatCurrency(data.overview.estimatedGrossProfit)}</span>
                        </div>
                        <div className="w-full h-3 bg-[#182030] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#B37B15] to-[#D99B26] rounded-full"
                            style={{ width: `${Math.min(Math.max(data.overview.grossMarginPercent, 0), 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="divide-y divide-[#1f293d] text-xs pt-2">
                        <div className="flex justify-between py-2.5">
                          <span className="text-[#9CA3AF]">Invoice Subtotal (Excl. Tax)</span>
                          <span className="font-bold text-white font-mono">{formatCurrency(data.overview.invoiceSubtotal)}</span>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <span className="text-[#9CA3AF]">Est. Margin Percentage</span>
                          <span className="font-bold text-[#D99B26] font-mono">{data.overview.grossMarginPercent}%</span>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <span className="text-[#9CA3AF]">Parts Acquisition Cost</span>
                          <span className="font-bold text-white font-mono">{formatCurrency(data.overview.totalPartsCost)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: REVENUE */}
          {activeTab === 'revenue' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Financial snapshot */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111827] border border-[#1f293d] p-4 rounded-xl">
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Gross Invoiced</span>
                  <div className="text-xl font-bold text-white mt-1">{formatCurrency(data.revenue.totalInvoiced)}</div>
                </div>
                <div className="bg-[#111827] border border-[#1f293d] p-4 rounded-xl">
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Total Cash Collected</span>
                  <div className="text-xl font-bold text-[#34D399] mt-1">{formatCurrency(data.revenue.totalCollected)}</div>
                </div>
                <div className="bg-[#111827] border border-[#1f293d] p-4 rounded-xl">
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Currently Outstanding</span>
                  <div className="text-xl font-bold text-[#F59E0B] mt-1">{formatCurrency(data.revenue.outstanding)}</div>
                </div>
                <div className="bg-[#111827] border border-[#1f293d] p-4 rounded-xl">
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Refunded</span>
                  <div className="text-xl font-bold text-white/70 mt-1">{formatCurrency(data.revenue.refunded)}</div>
                </div>
              </div>

              {/* Revenue Daily Trend SVG Chart */}
              <div className="bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Revenue Trend (Cash Collected)</h3>
                
                {data.revenue.revenueByPeriod.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF] text-center py-10">No payments collected in this range.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Visual representation using bar values */}
                    <div className="h-40 flex items-end justify-between gap-1.5 pt-6 border-b border-[#1f293d]">
                      {data.revenue.revenueByPeriod.map((pt, idx) => {
                        const maxVal = Math.max(...data.revenue.revenueByPeriod.map(p => p.amount), 1000);
                        const heightPct = (pt.amount / maxVal) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                            <div className="w-full bg-[#182030] rounded-t relative h-32 flex items-end">
                              <div 
                                className="w-full bg-gradient-to-t from-[#B37B15] to-[#D99B26] rounded-t transition duration-200 group-hover:brightness-125"
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                            {/* Hover tooltip */}
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1e293b] border border-[#334155] px-2 py-1 rounded text-[9px] font-mono text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 shadow-lg">
                              {pt.date}: {formatCurrency(pt.amount)}
                            </div>
                            <span className="text-[8px] text-[#6B7280] font-mono mt-1 select-none">
                              {pt.date.slice(8, 10)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-[#6B7280] font-mono text-center">Daily trend map (Horizontal axis indicates calendar day of month)</p>
                  </div>
                )}
              </div>

              {/* Split Category / Splits list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-[#9CA3AF] uppercase">Revenue by Category</h4>
                  <div className="space-y-2 text-xs">
                    {data.revenue.revenueByServiceType.length === 0 ? (
                      <p className="text-[#9CA3AF] py-6 text-center">No categories recorded.</p>
                    ) : (
                      data.revenue.revenueByServiceType.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-[#1f293d]/50">
                          <span className="text-white font-medium">{item.name}</span>
                          <span className="font-bold text-white font-mono">{formatCurrency(item.value)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-[#9CA3AF] uppercase">Revenue by Payment Method</h4>
                  <div className="space-y-2 text-xs">
                    {data.revenue.revenueByPaymentMethod.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-[#1f293d]/50">
                        <span className="text-white font-medium">{item.name}</span>
                        <span className="font-bold text-[#34D399] font-mono">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-[#9CA3AF] uppercase">Revenue by Technician</h4>
                  <div className="space-y-2 text-xs">
                    {data.revenue.revenueByTechnician.length === 0 ? (
                      <p className="text-[#9CA3AF] py-6 text-center">No technician records.</p>
                    ) : (
                      data.revenue.revenueByTechnician.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-[#1f293d]/50">
                          <span className="text-white font-medium">{item.name}</span>
                          <span className="font-bold text-white font-mono">{formatCurrency(item.value)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Ticket Lifecycle Breakdown</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {data.tickets.statusBreakdown.map((item, idx) => (
                    <div key={idx} className="bg-[#182030] p-4 rounded-xl border border-[#2d3b54] text-center">
                      <div className="text-[10px] text-[#9CA3AF] font-bold uppercase truncate" title={item.name}>
                        {item.name.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xl font-extrabold text-white mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Splits grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-[#9CA3AF] uppercase">Tickets by Priority</h4>
                  <div className="space-y-2 text-xs">
                    {data.tickets.ticketsByPriority.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-[#1f293d]/50">
                        <span className="text-white">{item.name}</span>
                        <span className="font-bold text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-[#9CA3AF] uppercase">Tickets by Brand</h4>
                  <div className="space-y-2 text-xs">
                    {data.tickets.ticketsByBrand.length === 0 ? (
                      <p className="text-[#9CA3AF] py-6 text-center">No brands logged.</p>
                    ) : (
                      data.tickets.ticketsByBrand.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-[#1f293d]/50">
                          <span className="text-white">{item.name}</span>
                          <span className="font-bold text-white">{item.value}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-[#9CA3AF] uppercase">Tickets by Device Category</h4>
                  <div className="space-y-2 text-xs">
                    {data.tickets.ticketsByCategory.length === 0 ? (
                      <p className="text-[#9CA3AF] py-6 text-center">No categories logged.</p>
                    ) : (
                      data.tickets.ticketsByCategory.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-[#1f293d]/50">
                          <span className="text-white">{item.name}</span>
                          <span className="font-bold text-white">{item.value}</span>
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
              
              {/* Payment metric summary card split */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-bold">Total Cash Collected</span>
                  <div className="text-2xl font-black text-[#34D399] mt-1">{formatCurrency(data.payments.totalCollected)}</div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Inflow within selected range</p>
                </div>
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-bold">Total Refunds</span>
                  <div className="text-2xl font-black text-red-400 mt-1">{formatCurrency(data.payments.refunds)}</div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Refunds paid back in range</p>
                </div>
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-bold">Net Cash Flow</span>
                  <div className="text-2xl font-black text-white mt-1">{formatCurrency(data.payments.netCollected)}</div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Collected minus refunded</p>
                </div>
              </div>

              {/* Outstanding Payments Table with custom pagination */}
              <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Outstanding Invoices</h3>
                  <span className="text-[11px] text-[#9CA3AF]">
                    Showing {data.payments.outstandingList.length} of {data.payments.pagination.total} outstanding bills
                  </span>
                </div>

                <div className="border border-[#1f293d] rounded-xl overflow-hidden text-xs">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#182030] text-[#9CA3AF] font-bold">
                      <tr className="border-b border-[#1f293d]">
                        <th className="px-4 py-3 text-left">Invoice No</th>
                        <th className="px-4 py-3 text-left">Customer Name</th>
                        <th className="px-4 py-3 text-right">Due Date</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d] text-[#CBD5E1]">
                      {data.payments.outstandingList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-[#9CA3AF]">
                            No outstanding invoices logged at this time!
                          </td>
                        </tr>
                      ) : (
                        data.payments.outstandingList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#182030]/50">
                            <td className="px-4 py-3 font-mono font-bold text-white">{item.invoiceNumber}</td>
                            <td className="px-4 py-3">{item.customerName}</td>
                            <td className="px-4 py-3 text-right font-mono">{item.dueDate}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'OVERDUE' 
                                  ? 'bg-[#7F1D1D]/30 text-red-400 border border-[#EF4444]/20'
                                  : 'bg-[#78350F]/30 text-[#F59E0B] border border-[#D97706]/20'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-white font-bold">
                              {formatCurrency(item.dueAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Custom Inline pagination */}
                {data.payments.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setPaymentsPage(prev => Math.max(prev - 1, 1))}
                      disabled={paymentsPage === 1}
                      className="p-1.5 bg-[#182030] hover:bg-[#202c40] text-white rounded-lg border border-[#2d3b54] disabled:opacity-50 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-[#CBD5E1] font-mono">
                      Page {data.payments.pagination.page} of {data.payments.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPaymentsPage(prev => Math.min(prev + 1, data.payments.pagination.totalPages))}
                      disabled={paymentsPage === data.payments.pagination.totalPages}
                      className="p-1.5 bg-[#182030] hover:bg-[#202c40] text-white rounded-lg border border-[#2d3b54] disabled:opacity-50 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: TECHNICIANS */}
          {activeTab === 'technicians' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Technician Workload &amp; Service Earnings</h3>
                
                <div className="border border-[#1f293d] rounded-xl overflow-hidden text-xs">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#182030] text-[#9CA3AF] font-bold">
                      <tr className="border-b border-[#1f293d]">
                        <th className="px-4 py-3 text-left">Technician Name</th>
                        <th className="px-4 py-3 text-center">Jobs Assigned</th>
                        <th className="px-4 py-3 text-center">Jobs Completed</th>
                        <th className="px-4 py-3 text-center">Active / Pending</th>
                        <th className="px-4 py-3 text-right">Avg completion time</th>
                        <th className="px-4 py-3 text-right">Service Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d] text-[#CBD5E1]">
                      {data.technicians.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-[#9CA3AF]">
                            No technician accounts setup for this store.
                          </td>
                        </tr>
                      ) : (
                        data.technicians.map((tech, idx) => (
                          <tr key={idx} className="hover:bg-[#182030]/50">
                            <td className="px-4 py-3 text-white font-bold">{tech.name}</td>
                            <td className="px-4 py-3 text-center font-mono">{tech.assigned}</td>
                            <td className="px-4 py-3 text-center font-mono text-[#34D399] font-bold">{tech.completed}</td>
                            <td className="px-4 py-3 text-center font-mono text-[#F59E0B]">{tech.pending}</td>
                            <td className="px-4 py-3 text-right font-mono">{tech.avgCompletionTime} days</td>
                            <td className="px-4 py-3 text-right font-mono text-white font-extrabold">
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
              
              {/* Spares split metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow">
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Parts Consumed</span>
                  <div className="text-2xl font-black text-white mt-1">{data.inventory.partsConsumed} units</div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Spares consumed in repairs</p>
                </div>
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow">
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Total Parts Charge</span>
                  <div className="text-2xl font-black text-[#D99B26] mt-1">{formatCurrency(data.inventory.partsCost)}</div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Sum value billed to clients</p>
                </div>
                <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-2xl shadow">
                  <span className="text-[10px] text-[#9CA3AF] uppercase">Inventory Book Value</span>
                  <div className="text-2xl font-black text-[#34D399] mt-1">{formatCurrency(data.inventory.totalInventoryValue)}</div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Total catalog stock value estimate</p>
                </div>
              </div>

              {/* Grid split: Top parts vs low stock */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Top Parts list */}
                <div className="lg:col-span-7 bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Top 10 Most Used Spare Parts</h3>
                  
                  <div className="border border-[#1f293d] rounded-xl overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-[#182030] text-[#9CA3AF] font-bold">
                        <tr className="border-b border-[#1f293d]">
                          <th className="px-4 py-2.5 text-left">Part Name / Description</th>
                          <th className="px-4 py-2.5 text-center">Qty Consumed</th>
                          <th className="px-4 py-2.5 text-right">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f293d] text-[#CBD5E1]">
                        {data.inventory.mostUsedParts.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-[#9CA3AF]">
                              No parts consumed in this period.
                            </td>
                          </tr>
                        ) : (
                          data.inventory.mostUsedParts.map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#182030]/50">
                              <td className="px-4 py-3 text-white font-bold">{item.name}</td>
                              <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                              <td className="px-4 py-3 text-right font-mono text-[#D99B26] font-bold">
                                {formatCurrency(item.totalCost)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Low stock alerts */}
                <div className="lg:col-span-5 bg-[#111827] border border-[#1f293d] p-6 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Low Stock Parts Alert</h3>
                  
                  <div className="space-y-3">
                    {data.inventory.lowStock.map((item, idx) => (
                      <div key={idx} className="bg-[#182030] border border-[#2d3b54] p-3.5 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="text-white font-bold">{item.name}</p>
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Threshold: {item.minStock} units</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-1 bg-red-950/40 text-red-400 border border-red-800/30 rounded font-bold font-mono">
                            Stock: {item.stock}
                          </span>
                        </div>
                      </div>
                    ))}
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
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    data.profitability.profitabilityStatus === 'FULL' 
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
    </div>
  );
};
