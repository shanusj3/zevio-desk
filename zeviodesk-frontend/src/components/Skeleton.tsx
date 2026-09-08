import React from 'react';

// ─── Base Shimmer Block ───────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div
    className={`relative overflow-hidden rounded-md bg-[#e2e8f0] ${className}`}
    style={style}
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
);

// ─── Stat Card Skeleton (matches StatCard layout exactly) ─────────────────────
export const StatCardSkeleton: React.FC = () => (
  <div className="relative overflow-hidden rounded-xl p-4 border border-[#dfe5eb] bg-white shadow-xs">
    <div className="flex items-center gap-3.5">
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-14" />
        <Skeleton className="h-2.5 w-36" />
      </div>
    </div>
  </div>
);

// ─── Table Row Skeleton ───────────────────────────────────────────────────────
interface TableRowSkeletonProps {
  cols?: number;
}

export const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({ cols = 7 }) => (
  <tr className="border-b border-[#e2e8f0]">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-3.5 px-5">
        {i === 0 ? (
          // First col: icon + name
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        ) : i === cols - 1 ? (
          // Last col: action buttons
          <div className="flex items-center gap-2 justify-end">
            <Skeleton className="w-7 h-7 rounded-md" />
            <Skeleton className="w-7 h-7 rounded-md" />
            <Skeleton className="w-7 h-7 rounded-md" />
          </div>
        ) : i === cols - 2 ? (
          // Status pill col
          <Skeleton className="h-5 w-16 rounded-full" />
        ) : (
          <Skeleton className={`h-3.5 ${i % 2 === 0 ? 'w-32' : 'w-24'}`} />
        )}
      </td>
    ))}
  </tr>
);

// ─── Reports Metric Card Skeleton ─────────────────────────────────────────────
export const ReportCardSkeleton: React.FC = () => (
  <div className="bg-white border border-[#dfe5eb] p-5 rounded-2xl shadow-xs space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="w-4 h-4 rounded" />
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-2.5 w-40" />
  </div>
);

// ─── Reports Bar Chart Skeleton ───────────────────────────────────────────────
export const ReportChartSkeleton: React.FC = () => (
  <div className="lg:col-span-2 bg-white border border-[#dfe5eb] p-6 rounded-2xl shadow-xs space-y-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-60" />
      </div>
      <Skeleton className="w-5 h-5 rounded" />
    </div>
    <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-[#dfe5eb]">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <Skeleton
            className="w-full rounded-t-lg"
            style={{ height: `${20 + Math.random() * 70}%` } as React.CSSProperties}
          />
          <Skeleton className="h-2 w-6" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Reports Pie Card Skeleton ────────────────────────────────────────────────
export const ReportPieSkeleton: React.FC = () => (
  <div className="bg-white border border-[#dfe5eb] p-6 rounded-2xl shadow-xs space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="w-5 h-5 rounded" />
    </div>
    <div className="flex flex-col items-center gap-4 py-4">
      <Skeleton className="w-32 h-32 rounded-full" />
      <div className="w-full space-y-2">
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

// ─── Full Page Reports Skeleton ──────────────────────────────────────────────
export const ReportsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <ReportCardSkeleton />
      <ReportCardSkeleton />
      <ReportCardSkeleton />
      <ReportCardSkeleton />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ReportChartSkeleton />
      <ReportPieSkeleton />
    </div>
  </div>
);


