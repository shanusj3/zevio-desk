import React from 'react';
import { Ticket } from '../../lib/api';
import { formatTicketReference } from '../../lib/ticketDisplay';
import { StatusBadge } from '../StatusBadge';

function defaultGetPriorityStyle(priority: Ticket['priority']) {
  switch (priority) {
    case 'URGENT': return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'NORMAL':
    default: return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
}

interface TicketDescriptionTabProps {
  ticket: Ticket;
  createdDate: string;
  mediaAttachments: any[];
  getPriorityStyle?: (priority: Ticket['priority']) => string;
}

export const TicketDescriptionTab: React.FC<TicketDescriptionTabProps> = ({
  ticket,
  createdDate,
  mediaAttachments,
  getPriorityStyle = defaultGetPriorityStyle,
}) => {
  return (
    <div className="space-y-5">
      {/* 1. REPORTED ISSUE Card */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="font-bold text-xs uppercase tracking-wider text-[#64748b]">
          <span>REPORTED ISSUE</span>
        </div>
        <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-xl text-xs font-medium text-[#1e293b] leading-relaxed">
          {ticket.reportedIssue || 'No issue reported.'}
        </div>
      </div>

      {/* 2. TICKET OVERVIEW & CUSTOMER / ASSIGNEE 2-Column Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left Card: Ticket Overview */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="font-bold text-xs uppercase tracking-wider text-[#64748b]">
            <span>TICKET OVERVIEW</span>
          </div>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 divide-y divide-[#e2e8f0]">
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Device / Model</span>
              <span className="font-bold text-[#1e293b] text-right">{ticket.title}</span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Job # / Reference</span>
              <span className="font-mono font-bold text-[#116dff]">{formatTicketReference(ticket)}</span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Status</span>
              <StatusBadge status={ticket.status} size="sm" />
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Priority</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityStyle(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Category</span>
              <span className="font-bold text-[#1e293b]">{ticket.itemCategory || '—'}</span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Date Created</span>
              <span className="font-medium text-[#1e293b]">{createdDate}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Customer & Assignee */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="font-bold text-xs uppercase tracking-wider text-[#64748b]">
            <span>CUSTOMER & ASSIGNEE</span>
          </div>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 divide-y divide-[#e2e8f0]">
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Customer</span>
              <span className="font-bold text-[#1e293b] text-right">{ticket.customer?.name || 'Walk-in'}</span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Mobile No</span>
              <span className="font-mono font-bold text-[#1e293b] text-right">{ticket.customer?.phone || '—'}</span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Assignee</span>
              <span className="font-bold text-[#1e293b]">{ticket.assignedTo?.name || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Serial No</span>
              <span className="font-mono font-medium text-[#1e293b]">{ticket.serialNumber || '—'}</span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Brand</span>
              <span className="font-bold text-[#1e293b]">{ticket.brand || '—'}</span>
            </div>
            <div className="flex justify-between py-2 items-center">
              <span className="font-semibold text-[#64748b]">Model</span>
              <span className="font-bold text-[#1e293b]">{ticket.model || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PHYSICAL CONDITION & ACCESSORIES Card */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="font-bold text-xs uppercase tracking-wider text-[#64748b]">
          <span>PHYSICAL CONDITION & ACCESSORIES</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-2">
            <span className="font-semibold text-[#64748b] block text-[10px] uppercase tracking-wider">Physical Condition</span>
            <p className="text-xs font-semibold text-[#1e293b] leading-relaxed">
              {ticket.itemCondition || 'No physical condition recorded.'}
            </p>
          </div>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-2">
            <span className="font-semibold text-[#64748b] block text-[10px] uppercase tracking-wider">Accessories Received</span>
            <p className="text-xs font-semibold text-[#1e293b] leading-relaxed">
              {ticket.accessories || 'No accessories recorded.'}
            </p>
          </div>
        </div>

        {/* Media/Images section */}
        {mediaAttachments && mediaAttachments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
            <span className="font-semibold text-[#64748b] block text-[10px] uppercase tracking-wider mb-2">Attached Images & Media</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {mediaAttachments.map((att: any) => (
                <a
                  key={att.id || att.url}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-square rounded-xl overflow-hidden border border-[#cbd5e1] group bg-white block hover:shadow-md transition-all duration-200"
                >
                  {att.type === 'video' ? (
                    <div className="w-full h-full relative">
                      <video src={att.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        <div className="bg-white/80 p-2 rounded-full shadow-sm">
                          <svg className="w-4 h-4 text-[#1e293b]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img src={att.url} alt={att.fileName || 'Attachment'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. ADDITIONAL NOTES Card */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="font-bold text-xs uppercase tracking-wider text-[#64748b]">
          <span>ADDITIONAL NOTES</span>
        </div>
        <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl text-xs font-medium text-[#1e293b] leading-relaxed">
          {ticket.internalNotes || '—'}
        </div>
      </div>
    </div>
  );
};
