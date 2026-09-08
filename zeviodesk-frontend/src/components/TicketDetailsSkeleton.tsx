import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TicketDetailsSkeletonProps {
  onBack?: () => void;
}

export const TicketDetailsSkeleton: React.FC<TicketDetailsSkeletonProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-xs text-[#1e293b] p-4 sm:p-6 space-y-6 animate-pulse">
      {/* ── Top Header / Breadcrumb Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-xs">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] hover:text-[#1e293b] hover:bg-slate-200/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-slate-200" />
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-40 bg-slate-200 rounded-lg" />
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="h-3.5 w-64 bg-slate-200 rounded-md" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* ── Main Full-Width Content Container ── */}
      <div className="w-full space-y-6">
        {/* Tabbed Details Skeleton */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 bg-[#f8fafc] flex flex-wrap gap-4 border-b border-[#e2e8f0]">
            <div className="h-9 w-44 bg-slate-200 rounded-xl" />
            <div className="h-9 w-36 bg-slate-200 rounded-xl" />
            <div className="h-9 w-32 bg-slate-200 rounded-xl" />
            <div className="h-9 w-48 bg-slate-200 rounded-xl" />
          </div>

          <div className="p-6 space-y-6">
            {/* 2-Column Grid Skeleton inside Description Tab */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 divide-y divide-[#e2e8f0]">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between py-2.5 items-center">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-4 w-36 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>

              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 divide-y divide-[#e2e8f0]">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex justify-between py-2.5 items-center">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-44 bg-slate-100 rounded-xl shrink-0" />
                  <div className="h-10 w-full bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
