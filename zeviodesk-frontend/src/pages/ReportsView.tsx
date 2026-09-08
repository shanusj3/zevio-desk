import React, { useState } from 'react';
import { Download, TrendingUp, Users, Store, ShieldAlert, BarChart2, PieChart, AlertCircle } from 'lucide-react';
import { Tenant } from '../types';
import { useReportsQuery } from '../hooks/useReportsQuery';
import {
  ReportCardSkeleton,
  ReportChartSkeleton,
  ReportPieSkeleton,
} from '../components/Skeleton';

interface ReportsViewProps {}

export const ReportsView: React.FC<ReportsViewProps> = () => {
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '1y'>('30d');
  
  const { data: reportsData, isLoading, isError } = useReportsQuery();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header banner skeleton */}
        <div className="bg-[#101622] border border-[#1b2536] p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="relative overflow-hidden rounded-md bg-[#1b2536] h-5 w-56">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
            <div className="relative overflow-hidden rounded-md bg-[#1b2536] h-3 w-72">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-[#1b2536] h-9 w-48">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>
        </div>

        {/* Metric cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportCardSkeleton />
          <ReportCardSkeleton />
          <ReportCardSkeleton />
          <ReportCardSkeleton />
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ReportChartSkeleton />
          <ReportPieSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !reportsData) {
    return (
      <div className="bg-[#7F1D1D]/40 border border-[#DC2626]/40 p-6 rounded-2xl text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto" />
        <p className="text-sm font-bold text-white">Error loading reports</p>
        <p className="text-xs text-[#94A3B8]">Unable to fetch analytics data from backend.</p>
      </div>
    );
  }

  const {
    estimatedMonthlyRevenue: revenueLastThirtyDays = 0,
    averageUsersPerTenant = 0,
    activeCount = 0,
    inactiveCount = 0,
    totalTenants = 0,
    churnRate = 0,
    tenantGrowthTrend = [],
  } = reportsData;

  const activeRate = totalTenants > 0 ? ((activeCount / totalTenants) * 100).toFixed(1) : "0.0";


  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#101622] border border-[#1b2536] p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Platform Analytics & Reports
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Real-time multi-tenant health, growth metrics, and revenue summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#162030] border border-[#22314a] p-1 rounded-xl text-xs font-semibold">
            {(['30d', '90d', '1y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-[#D99B26] text-[#0d121c] font-bold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {tf === '30d' ? '30 Days' : tf === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>

          <button
            onClick={() => alert('Platform executive PDF report generated.')}
            className="px-4 py-2 bg-[#182236] hover:bg-[#202d47] text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-[#2a3a57] transition-all"
          >
            <Download className="w-4 h-4 text-[#D99B26]" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#101622] border border-[#1b2536] p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Revenue (Last 30 Days)</span>
            <TrendingUp className="w-4 h-4 text-[#34D399]" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ${revenueLastThirtyDays.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#34D399] font-medium mt-1 inline-block">
            Actual payments collected
          </span>
        </div>

        <div className="bg-[#101622] border border-[#1b2536] p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Average Users / Tenant</span>
            <Users className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{averageUsersPerTenant}</div>
          <span className="text-[11px] text-[#3B82F6] font-medium mt-1 inline-block">
            High platform engagement
          </span>
        </div>

        <div className="bg-[#101622] border border-[#1b2536] p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Active Tenant Ratio</span>
            <Store className="w-4 h-4 text-[#5EEAD4]" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {activeRate}%
          </div>
          <span className="text-[11px] text-[#5EEAD4] font-medium mt-1 inline-block">
            {activeCount} active out of {totalTenants} loaded
          </span>
        </div>

        <div className="bg-[#101622] border border-[#1b2536] p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Churn & Inactive</span>
            <ShieldAlert className="w-4 h-4 text-[#F87171]" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{churnRate}%</div>
          <span className="text-[11px] text-[#F87171] font-medium mt-1 inline-block">
            Suspended/Inactive tenants
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Onboarding Trend Bar Chart Visual */}
        <div className="lg:col-span-2 bg-[#101622] border border-[#1b2536] p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Tenant Growth Trend
              </h3>
              <p className="text-xs text-[#64748B]">
                Monthly new tenant registrations in 2025/2026
              </p>
            </div>
            <BarChart2 className="w-5 h-5 text-[#D99B26]" />
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-[#1b2536]">
            {tenantGrowthTrend.map((m, idx) => {
              const maxVal = Math.max(...tenantGrowthTrend.map(t => t.value), 10);
              const heightPercent = (m.value / maxVal) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-[#182236] rounded-t-lg relative group overflow-hidden h-36 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-[#B37B15] to-[#D99B26] rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-white opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                      {m.value}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution Visual */}
        <div className="bg-[#101622] border border-[#1b2536] p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Status Breakdown</h3>
            <PieChart className="w-5 h-5 text-[#34D399]" />
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-32 h-32 rounded-full border-8 border-[#34D399] border-t-[#F87171] flex flex-col items-center justify-center shadow-inner my-2">
              <span className="text-2xl font-bold text-white">{activeRate}%</span>
              <span className="text-[10px] text-[#64748B]">Active Rate</span>
            </div>

            <div className="w-full space-y-2 mt-4 text-xs">
              <div className="flex items-center justify-between bg-[#162030] p-2.5 rounded-xl border border-[#22314a]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                  <span className="text-white">Active Tenants</span>
                </div>
                <span className="font-bold text-white">{activeCount}</span>
              </div>

              <div className="flex items-center justify-between bg-[#162030] p-2.5 rounded-xl border border-[#22314a]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
                  <span className="text-white">Inactive Tenants</span>
                </div>
                <span className="font-bold text-white">{inactiveCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
