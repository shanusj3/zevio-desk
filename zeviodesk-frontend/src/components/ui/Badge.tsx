import React from 'react';

export type BadgeVariant =
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'walk_in'
  | 'returning'
  | 'business'
  | 'completed'
  | 'diagnosing'
  | 'urgent'
  | 'normal'
  | 'warranty'
  | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  in_stock: 'bg-[#1e293b] text-white font-bold uppercase tracking-wider',
  low_stock: 'bg-[#fef3c7] text-[#d97706] font-bold uppercase tracking-wider',
  out_of_stock: 'bg-[#fee2e2] text-[#dc2626] font-bold uppercase tracking-wider',
  walk_in: 'bg-[#1e293b] text-white font-bold uppercase tracking-wider',
  returning: 'bg-[#eff6ff] text-[#116dff] font-bold uppercase tracking-wider',
  business: 'bg-[#f3e8ff] text-[#9333ea] font-bold uppercase tracking-wider',
  completed: 'bg-[#d1fae5] text-[#059669] font-bold uppercase tracking-wider',
  diagnosing: 'bg-[#fef3c7] text-[#d97706] font-bold uppercase tracking-wider',
  urgent: 'bg-[#fee2e2] text-[#dc2626] font-bold uppercase tracking-wider',
  normal: 'bg-[#f1f5f9] text-[#475569] font-semibold',
  warranty: 'bg-[#dbeafe] text-[#2563eb] font-semibold',
  default: 'bg-[#f1f5f9] text-[#1e293b] font-semibold',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs transition-colors ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
