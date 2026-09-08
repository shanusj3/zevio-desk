import React from 'react';
import { Check, Clock, X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getStatusLabel } from '../lib/ticketDisplay';

export type BadgeStatusType =
  | 'RECEIVED' | 'NEW'
  | 'DIAGNOSING' | 'WAITING_FOR_PARTS' | 'WAITING' | 'PENDING' | 'IN_PROGRESS'
  | 'REPAIR_COMPLETED' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'DELIVERED' | 'ACCEPTED'
  | 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'PARTIAL' | 'ISSUED' | 'DRAFT'
  | 'CANCELLED' | 'DECLINED' | 'VOID' | 'REJECTED' | 'EXPIRED'
  | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
  | string;

export interface StatusBadgeProps {
  status: BadgeStatusType;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label: customLabel,
  className = '',
  size = 'md',
}) => {
  const displayLabel = customLabel || getStatusLabel(status);
  const s = String(status || '').toUpperCase();

  // Size styling maps
  const paddingMap = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const iconContainerSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  };

  const iconSize = {
    sm: 'w-2 h-2 stroke-[3]',
    md: 'w-2.5 h-2.5 stroke-[3]',
    lg: 'w-3 h-3 stroke-[3]',
  };

  // Status style definitions
  if (s === 'IN_PROGRESS' || s === 'ADDED' || s === 'ACTIVE') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#007aff] text-white ${paddingMap[size]} ${className}`}>
        <span className={`${iconContainerSize[size]} rounded-full bg-white text-[#007aff] flex items-center justify-center shrink-0`}>
          <Check className={iconSize[size]} />
        </span>
        <span className="whitespace-nowrap">{displayLabel}</span>
      </span>
    );
  }

  if (s === 'WAITING_FOR_PARTS' || s === 'WAITING' || s === 'PENDING' || s === 'DIAGNOSING' || s === 'PARTIALLY_PAID' || s === 'PARTIAL') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#fff4eb] text-[#f97316] ${paddingMap[size]} ${className}`}>
        <span className={`${iconContainerSize[size]} rounded-full bg-[#f97316] text-white flex items-center justify-center shrink-0`}>
          <Clock className={iconSize[size]} />
        </span>
        <span className="whitespace-nowrap">{displayLabel}</span>
      </span>
    );
  }

  if (s === 'COMPLETED' || s === 'ACCEPTED' || s === 'READY_FOR_PICKUP' || s === 'REPAIR_COMPLETED' || s === 'PAID' || s === 'DELIVERED' || s === 'ISSUED') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#eefcf3] text-[#10b981] ${paddingMap[size]} ${className}`}>
        <span className={`${iconContainerSize[size]} rounded-full bg-[#10b981] text-white flex items-center justify-center shrink-0`}>
          <Check className={iconSize[size]} />
        </span>
        <span className="whitespace-nowrap">{displayLabel}</span>
      </span>
    );
  }

  if (s === 'CANCELLED' || s === 'DECLINED' || s === 'VOID' || s === 'REJECTED' || s === 'EXPIRED' || s === 'UNPAID' || s === 'SUSPENDED') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#fff0f0] text-[#ef4444] ${paddingMap[size]} ${className}`}>
        <span className={`${iconContainerSize[size]} rounded-full bg-[#ef4444] text-white flex items-center justify-center shrink-0`}>
          <X className={iconSize[size]} />
        </span>
        <span className="whitespace-nowrap">{displayLabel}</span>
      </span>
    );
  }

  if (s === 'RECEIVED' || s === 'NEW' || s === 'DRAFT') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#eff6ff] text-[#0284c7] ${paddingMap[size]} ${className}`}>
        <span className={`${iconContainerSize[size]} rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0`}>
          <Check className={iconSize[size]} />
        </span>
        <span className="whitespace-nowrap">{displayLabel}</span>
      </span>
    );
  }

  if (s === 'ADD' || s === 'CREATE') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#f1f5f9] text-[#475569] ${paddingMap[size]} ${className}`}>
        <span className={`${iconContainerSize[size]} rounded-full bg-[#64748b] text-white flex items-center justify-center shrink-0`}>
          <Plus className={iconSize[size]} />
        </span>
        <span className="whitespace-nowrap">{displayLabel}</span>
      </span>
    );
  }

  // Default fallback badge
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-slate-100 text-slate-700 ${paddingMap[size]} ${className}`}>
      <span className={`${iconContainerSize[size]} rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0`}>
        <Check className={iconSize[size]} />
      </span>
      <span className="whitespace-nowrap">{displayLabel}</span>
    </span>
  );
};
