import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Clock,
  DollarSign,
  Tag,
  Hammer,
  Shield,
  Layers,
  FileText,
} from 'lucide-react';
import { Ticket } from '../lib/api';
import { StatusBadge } from './StatusBadge';

interface TicketDetailsDrawerProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export const TicketDetailsDrawer: React.FC<TicketDetailsDrawerProps> = ({
  ticket,
  onClose,
}) => {
  if (!ticket) return null;

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-900/60 text-red-300 border border-red-500/40';
      case 'NORMAL':
      default:
        return 'bg-[#78350F]/80 text-[#FCD34D] border border-[#D97706]/30';
    }
  };

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-[#1E3A8A]/80 text-[#93C5FD] border border-[#2563EB]/30';
      case 'DIAGNOSING':
        return 'bg-[#4C1D95]/80 text-[#C4B5FD] border border-[#7C3AED]/30';
      case 'WAITING_FOR_PARTS':
        return 'bg-[#78350F]/80 text-[#FCD34D] border border-[#D97706]/30';
      case 'IN_PROGRESS':
        return 'bg-[#854D0E]/80 text-[#FDE68A] border border-[#CA8A04]/30';
      case 'READY_FOR_PICKUP':
        return 'bg-[#14532D]/80 text-[#86EFAC] border border-[#16A34A]/30';
      case 'COMPLETED':
        return 'bg-[#064E3B]/80 text-[#34D399] border border-[#059669]/30';
      case 'CANCELLED':
        return 'bg-[#1e293b]/80 text-[#94a3b8] border border-[#334155]/30';
      default:
        return 'bg-[#1e293b] text-[#94a3b8]';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Drawer container */}
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-2xl bg-[#0f1522] border-l border-[#1b2536] flex flex-col shadow-2xl relative"
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-[#1b2536] flex items-center justify-between bg-[#131b2e]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D99B26] to-[#F59E0B] flex items-center justify-center shadow-lg shadow-[#D99B26]/10">
                  <FileText className="w-5 h-5 text-[#0d121c]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    Ticket Details
                  </h2>
                  <p className="text-[10px] text-[#64748B] font-mono select-all">
                    ID: {ticket.id}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#1c263a] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Top Summary Banner */}
              <div className="bg-[#141c2c] border border-[#23314a] rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority === 'URGENT' ? '🔴 Urgent' : '🟤 Normal'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#64748B] font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white leading-snug">{ticket.title}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>

              {/* Grid of Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Customer Info Section */}
                <div className="bg-[#111726] border border-[#1b2536] rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1b2536] pb-2">
                    <User className="w-3.5 h-3.5 text-[#D99B26]" />
                    Customer Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-semibold uppercase tracking-wider">Name</span>
                      <span className="text-xs font-medium text-white">{ticket.customer?.name || 'Walk-in Customer'}</span>
                    </div>
                    {ticket.customer?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                        <span className="text-xs text-[#CBD5E1] font-mono">{ticket.customer.phone}</span>
                      </div>
                    )}
                    {ticket.customer?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                        <span className="text-xs text-[#CBD5E1] font-mono">{ticket.customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Device / Service Details Section */}
                <div className="bg-[#111726] border border-[#1b2536] rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1b2536] pb-2">
                    <Hammer className="w-3.5 h-3.5 text-[#D99B26]" />
                    Device Info
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-[#64748B] block font-semibold uppercase tracking-wider">Category</span>
                        <span className="text-xs font-medium text-white">{ticket.itemCategory || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] block font-semibold uppercase tracking-wider">Brand / Model</span>
                        <span className="text-xs font-medium text-white">
                          {ticket.brand || ticket.model ? `${ticket.brand || ''} ${ticket.model || ''}` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-[#64748B] block font-semibold uppercase tracking-wider">Serial Number</span>
                        <span className="text-xs font-medium text-white font-mono">{ticket.serialNumber || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] block font-semibold uppercase tracking-wider">Condition</span>
                        <span className="text-xs font-medium text-white">{ticket.itemCondition || '—'}</span>
                      </div>
                    </div>
                    {ticket.accessories && (
                      <div>
                        <span className="text-[10px] text-[#64748B] block font-semibold uppercase tracking-wider">Accessories</span>
                        <span className="text-xs font-medium text-white">{ticket.accessories}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estimation / Billing Section */}
                <div className="bg-[#111726] border border-[#1b2536] rounded-2xl p-5 space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1b2536] pb-2">
                    <DollarSign className="w-3.5 h-3.5 text-[#D99B26]" />
                    Financial Summary
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-[#141b2c] p-4 rounded-xl border border-[#23314a]/30">
                      <span className="text-[10px] text-[#64748B] block font-semibold uppercase tracking-wider mb-1">Estimated Cost</span>
                      <span className="text-base font-bold text-white font-mono">
                        {ticket.estimatedCost ? `$${ticket.estimatedCost.toFixed(2)}` : '—'}
                      </span>
                    </div>
                    <div className="bg-[#141b2c] p-4 rounded-xl border border-[#23314a]/30">
                      <span className="text-[10px] text-[#64748B] block font-semibold uppercase tracking-wider mb-1">Total Amount</span>
                      <span className="text-base font-bold text-[#D99B26] font-mono">
                        {ticket.totalAmount ? `$${ticket.totalAmount.toFixed(2)}` : '—'}
                      </span>
                    </div>
                    <div className="bg-[#141b2c] p-4 rounded-xl border border-[#23314a]/30 flex flex-col justify-between">
                      <span className="text-[10px] text-[#64748B] block font-semibold uppercase tracking-wider mb-1">Payment Status</span>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ticket.paymentStatus === 'PAID'
                            ? 'bg-[#064E3B]/80 text-[#34D399] border border-[#059669]/30'
                            : ticket.paymentStatus === 'PARTIAL'
                            ? 'bg-[#78350F]/80 text-[#FCD34D] border border-[#D97706]/30'
                            : 'bg-[#7F1D1D]/80 text-[#F87171] border border-[#DC2626]/30'
                        }`}>
                          {ticket.paymentStatus || 'UNPAID'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment & Management Info */}
                <div className="bg-[#111726] border border-[#1b2536] rounded-2xl p-5 space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1b2536] pb-2">
                    <Shield className="w-3.5 h-3.5 text-[#D99B26]" />
                    Internal Assignment
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#162030] rounded-full flex items-center justify-center border border-[#22314a]">
                      <User className="w-5 h-5 text-[#94A3B8]" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-semibold uppercase tracking-wider">Assigned Agent</span>
                      <span className="text-xs font-medium text-white">{ticket.assignedTo?.name || 'Unassigned'}</span>
                      {ticket.assignedTo?.email && (
                        <span className="block text-[10px] text-[#64748B] font-mono mt-0.5">{ticket.assignedTo.email}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#1b2536] bg-[#0c1017] flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-[#1b2536] text-[#94A3B8] hover:text-white hover:bg-[#162030] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
