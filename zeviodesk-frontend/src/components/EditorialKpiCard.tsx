import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface BarDataPoint {
  label: string; // e.g. "4 days\nago" or "Today"
  displayValue: string | number; // e.g. 142 or "₹15.2K"
  numericValue: number; // for calculating bar height percentage
  isToday?: boolean;
}

export interface EditorialKpiCardProps {
  title: string;
  value: string | number;
  description: string;
  bgColor: string; // Hex color e.g. "#35A9A8"
  bars: BarDataPoint[];
  wavePath: string; // SVG path d attribute e.g. "M 10 30 Q 90 45, 170 20 T 310 15"
  circlePos: { cx: number; cy: number };
  onReportClick?: () => void;
  className?: string;
}

export const EditorialKpiCard: React.FC<EditorialKpiCardProps> = ({
  title,
  value,
  description,
  bgColor,
  bars,
  wavePath,
  circlePos,
  onReportClick,
  className = '',
}) => {
  // Calculate max numeric value for relative bar heights
  const maxVal = Math.max(...bars.map((b) => b.numericValue), 1);

  return (
    <div
      className={`relative rounded-[22px] p-6 text-white overflow-hidden shadow-md shadow-black/5 flex flex-col justify-between transition-all duration-200 ${className}`}
      style={{
        backgroundColor: bgColor,
        backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.18) 1.2px, transparent 1.2px)`,
        backgroundSize: '16px 16px',
      }}
    >
      <div>
        {/* Card Header: Title */}
        <h3 className="text-xs uppercase font-semibold text-white/90 tracking-wider">
          {title}
        </h3>

        {/* Main Metric */}
        <div className="text-4xl sm:text-5xl font-light text-white my-2 tracking-tight">
          {value}
        </div>

        {/* Description */}
        <p className="text-xs sm:text-[13px] text-white/85 leading-snug font-normal whitespace-pre-line max-w-[260px]">
          {description}
        </p>

        {/* Dotted Trend Wave Line */}
        <div className="w-full my-4 relative h-12">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 320 50"
            preserveAspectRatio="none"
          >
            {/* Dotted Wave Path */}
            <path
              d={wavePath}
              fill="none"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
            {/* End Circle Marker */}
            <circle
              cx={circlePos.cx}
              cy={circlePos.cy}
              r="6"
              fill="none"
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* 5-Bar Chart */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 items-end h-32 pt-2">
          {bars.map((bar, idx) => {
            const heightPercent = Math.max(
              Math.round((bar.numericValue / maxVal) * 100),
              20
            );
            const isToday = bar.isToday || idx === 4;

            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-end h-full group"
              >
                {/* Bar Value above */}
                <span
                  className={`text-[11px] sm:text-xs font-semibold mb-1.5 transition-colors ${
                    isToday ? 'text-[#FDE047] font-bold' : 'text-white/90'
                  }`}
                >
                  {bar.displayValue}
                </span>

                {/* Vertical Bar */}
                <div
                  className="w-full bg-black/25 rounded-t-sm relative transition-all duration-300 overflow-hidden flex flex-col justify-start"
                  style={{ height: `${heightPercent}%` }}
                >
                  {/* Top Yellow Accent Line */}
                  <div
                    className={`h-[2px] w-full ${
                      isToday
                        ? 'bg-[#FDE047] shadow-[0_0_6px_#FDE047]'
                        : 'bg-[#FDE047]/70'
                    }`}
                  />
                </div>

                {/* Date Label Below */}
                <div className="mt-2 text-center min-h-[28px] flex flex-col justify-start">
                  {isToday ? (
                    <span className="text-[#FDE047] text-[10px] sm:text-[11px] font-bold leading-tight">
                      Today
                    </span>
                  ) : (
                    <span className="text-white/80 text-[10px] sm:text-[11px] font-medium leading-tight whitespace-pre-line">
                      {bar.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Divider & Link */}
      <div className="mt-4 pt-3 border-t border-white/20">
        <button
          onClick={onReportClick}
          className="w-full flex items-center justify-between text-xs sm:text-sm font-medium text-white/95 hover:text-white transition-colors cursor-pointer group"
        >
          <span>See Detailed Report</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
