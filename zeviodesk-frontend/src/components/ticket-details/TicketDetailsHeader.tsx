import React from 'react';
import {
  ArrowLeft,
  Pencil,
  FileText,
  Loader2,
  Wrench,
  CheckCircle2,
  Check,
  IndianRupee,
  Link,
} from 'lucide-react';
import { Ticket } from '../../lib/api';
import { formatTicketReference } from '../../lib/ticketDisplay';
import { StatusBadge } from '../StatusBadge';
import { navigate, ticketBillingPath } from '../../lib/navigation';

interface TicketDetailsHeaderProps {
  ticket: Ticket;
  onBack: () => void;
  onEdit?: (ticket: Ticket) => void;
  isLinkCopied: boolean;
  onCopyTrackingLink: () => void;
  isTechnician: boolean;
  completeRepairMutationPending: boolean;
  onCompleteRepair: () => void;
}

export const TicketDetailsHeader: React.FC<TicketDetailsHeaderProps> = ({
  ticket,
  onBack,
  onEdit,
  isLinkCopied,
  onCopyTrackingLink,
  isTechnician,
  completeRepairMutationPending,
  onCompleteRepair,
}) => {
  return (
    <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-30 flex items-center justify-between gap-4 bg-white/95 backdrop-blur-md border-b border-[#cbd5e1] px-5 py-3.5 sm:px-8 shadow-xs transition-all">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[#116dff] transition hover:bg-[#e2e8f0] cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex items-center gap-3">
          <StatusBadge status={ticket.status} />
          <span className="text-[#64748B] font-mono text-sm border-l border-[#e2e8f0] pl-3">
            #{formatTicketReference(ticket)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <button
          type="button"
          onClick={onCopyTrackingLink}
          className={`px-4 h-9 rounded-full text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer bg-white ${
            isLinkCopied
              ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700'
              : 'border-blue-200 text-[#116dff] hover:bg-[#116dff] hover:text-white hover:border-[#116dff]'
          }`}
          title="Copy Customer Tracking Link"
        >
          {isLinkCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in duration-150 shrink-0" />
              <span className="font-bold">Link Copied!</span>
            </>
          ) : (
            <>
              <Link className="w-3.5 h-3.5 shrink-0" />
              <span>Tracking Link</span>
            </>
          )}
        </button>
        {ticket.status !== 'DELIVERED' && ticket.status !== 'COMPLETED' && onEdit && (
          <button
            onClick={() => onEdit(ticket)}
            className="px-4 h-9 rounded-full text-xs font-medium flex items-center gap-2 border border-[#e2e8f0] bg-white text-[#116dff] hover:bg-[#116dff] hover:text-white hover:border-[#116dff] transition-all cursor-pointer shadow-xs"
          >
            <Pencil className="w-3.5 h-3.5 shrink-0" />
            <span>Edit</span>
          </button>
        )}
        {/* Workflow Status Actions */}
        {['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS'].includes(ticket.status) ? (
          <button
            onClick={onCompleteRepair}
            disabled={completeRepairMutationPending}
            className="flex items-center gap-2 px-5 h-9 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-bold rounded-full text-xs transition-all shadow-lg shadow-[#116dff]/10 cursor-pointer disabled:opacity-50"
          >
            {completeRepairMutationPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wrench className="w-4 h-4 shrink-0" />
            )}
            <span>Complete Repair</span>
          </button>
        ) : ticket.status === 'REPAIR_COMPLETED' ? (
          isTechnician ? (
            <div className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Repair Completed (Awaiting Invoice)</span>
            </div>
          ) : (
            <button
              onClick={() => navigate(ticketBillingPath(ticket.id))}
              className="flex items-center gap-2 px-5 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Generate Invoice</span>
            </button>
          )
        ) : ticket.status === 'READY_FOR_PICKUP' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(ticketBillingPath(ticket.id))}
              className="flex items-center gap-2 px-4 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer"
            >
              <IndianRupee className="w-4 h-4 shrink-0" />
              <span>View Invoice</span>
            </button>
          </div>
        ) : ticket.status === 'DELIVERED' || ticket.status === 'COMPLETED' ? (
          <button
            onClick={() => navigate(ticketBillingPath(ticket.id))}
            className="flex items-center gap-2 px-5 h-9 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-full text-xs transition-all cursor-pointer"
          >
            <IndianRupee className="w-4 h-4 shrink-0" />
            <span>View Invoice</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
