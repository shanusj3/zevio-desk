import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Search, Loader2, Banknote, CreditCard, QrCode,
  User, Smartphone, Tag, Plus, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi, Ticket } from '../lib/api';
import {
  useInvoiceQuery,
  useAddLineItemMutation,
  useRemoveLineItemMutation,
  useFinalizeInvoiceMutation,
  useCreatePaymentMutation,
  usePaymentsQuery,
} from '../hooks/useTicketsQuery';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatters';

interface NewInvoicePageProps {
  onBack: () => void;
}

const fmt = (n: number | string) =>
  formatCurrency(n, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ── Ticket Search Step ────────────────────────────────────────────────────────
const TicketSearchStep: React.FC<{ onSelect: (t: Ticket) => void }> = ({ onSelect }) => {
  const [search, setSearch] = useState('');

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets-billing-search'],
    queryFn: () => ticketsApi.fetchAll({ statusIn: ['READY_FOR_PICKUP', 'CANCELLED'] }),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    const term = search.toLowerCase();
    return tickets.filter(t =>
      (t.jobNumber ?? '').toLowerCase().includes(term) ||
      t.customer?.name?.toLowerCase().includes(term) ||
      t.customer?.phone?.includes(term) ||
      (t.brand ?? '').toLowerCase().includes(term) ||
      (t.model ?? '').toLowerCase().includes(term)
    );
  }, [tickets, search]);

  const readyTickets = filtered.filter(t => t.status === 'READY_FOR_PICKUP');
  const cancelledTickets = filtered.filter(t => t.status === 'CANCELLED');

  return (
    <div className="space-y-5">
      {/* Search field */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
        <input
          id="new-invoice-ticket-search"
          type="text"
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ticket number, customer name or phone..."
          className="w-full h-14 pl-12 pr-4 bg-[#0d1322] border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#D99B26]/60 transition text-base"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#D99B26]" />
        </div>
      ) : filtered.length === 0 && search ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-sm text-white font-medium">No results found</p>
          <p className="text-xs text-[#475569]">Try searching by ticket number, customer name, or phone number.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {readyTickets.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest px-1">Ready for Pickup</p>
              {readyTickets.map(t => (
                <TicketRow key={t.id} ticket={t} onSelect={onSelect} />
              ))}
            </div>
          )}
          {cancelledTickets.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest px-1">Cancelled</p>
              {cancelledTickets.map(t => (
                <TicketRow key={t.id} ticket={t} onSelect={onSelect} />
              ))}
            </div>
          )}
          {filtered.length === 0 && !search && (
            <div className="text-center py-16 space-y-2">
              <p className="text-sm text-white font-medium">No eligible tickets</p>
              <p className="text-xs text-[#475569]">Only tickets marked Ready for Pickup or Cancelled appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Standalone sale note */}
      <div className="rounded-xl border border-white/[0.05] bg-[#0d1322]/60 px-4 py-3 text-center">
        <p className="text-xs text-[#475569]">
          Standalone walk-in product sales (without a repair ticket) will be supported in a future update.
        </p>
      </div>
    </div>
  );
};

const TicketRow: React.FC<{ ticket: Ticket; onSelect: (t: Ticket) => void }> = ({ ticket, onSelect }) => (
  <button
    id={`ticket-row-${ticket.id}`}
    onClick={() => onSelect(ticket)}
    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-white/[0.07] bg-[#0d1322] hover:border-[#D99B26]/40 hover:bg-[#D99B26]/5 transition group text-left"
  >
    <div className="w-9 h-9 rounded-xl bg-[#D99B26]/10 flex items-center justify-center shrink-0">
      <Smartphone className="w-4 h-4 text-[#D99B26]" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-white group-hover:text-[#D99B26] transition">{ticket.customer?.name ?? '—'}</p>
        {ticket.jobNumber && <span className="text-[10px] font-mono text-[#475569]">{ticket.jobNumber}</span>}
      </div>
      <p className="text-xs text-[#64748B] mt-0.5 truncate">{[ticket.brand, ticket.model].filter(Boolean).join(' ') || '—'}</p>
    </div>
    <div className="text-right shrink-0">
      {ticket.totalAmount != null && ticket.totalAmount > 0 && (
        <p className="text-sm font-semibold text-white">{fmt(ticket.totalAmount)}</p>
      )}
      <p className="text-[10px] text-[#475569] mt-0.5">{ticket.customer?.phone ?? ''}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-[#475569] group-hover:text-[#D99B26] transition shrink-0" />
  </button>
);

// ── Payment Collection Step ───────────────────────────────────────────────────
const PaymentStep: React.FC<{ ticket: Ticket; onBack: () => void; onDone: () => void }> = ({
  ticket, onBack, onDone
}) => {
  const { showToast } = useAppStore();
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const { data: invoiceData, isLoading: loadingInvoice } = useInvoiceQuery(ticket.id);
  const { data: payments = [] } = usePaymentsQuery(ticket.id);
  const addLineMutation = useAddLineItemMutation();
  const removeLineMutation = useRemoveLineItemMutation();
  const finalizeMutation = useFinalizeInvoiceMutation();
  const createPaymentMutation = useCreatePaymentMutation();

  const isFinalized = invoiceData && 'status' in invoiceData && (invoiceData as any).status === 'FINALIZED';

  // Pull line items & totals
  const lineItems: any[] = isFinalized
    ? (invoiceData as any).lineItemsSnapshot ?? []
    : (invoiceData as any)?.lineItems ?? [];

  const totals = (invoiceData as any)?.totals ?? (invoiceData as any);
  const total = parseFloat(isFinalized ? (invoiceData as any).total : totals?.total ?? '0');
  const balanceDue = parseFloat(isFinalized ? (invoiceData as any).balanceDue : totals?.balanceDue ?? String(total));
  const amountPaid = parseFloat(isFinalized ? (invoiceData as any).amountPaid : totals?.amountPaid ?? '0');

  const handleAddItem = () => {
    if (!newDesc.trim() || !newPrice.trim()) return;
    addLineMutation.mutate({
      ticketId: ticket.id,
      data: { description: newDesc, unitPrice: parseFloat(newPrice), quantity: 1, type: 'SERVICE', taxMode: 'NONE' }
    }, {
      onSuccess: () => { setNewDesc(''); setNewPrice(''); setShowAddItem(false); },
      onError: (e: any) => showToast(e?.message ?? 'Failed to add item', 'warning'),
    });
  };

  const handleCollectPayment = async () => {
    try {
      // Finalize if not already done
      if (!isFinalized) {
        await finalizeMutation.mutateAsync({ ticketId: ticket.id, data: {} });
      }
      // Record payment
      if (balanceDue > 0) {
        await createPaymentMutation.mutateAsync({
          ticketId: ticket.id,
          data: { amount: balanceDue, method: payMethod, type: 'FINAL' }
        });
      }
      showToast('Payment collected successfully!', 'success');
      onDone();
    } catch (e: any) {
      showToast(e?.message ?? 'Payment failed', 'warning');
    }
  };

  const isBusy = finalizeMutation.isPending || createPaymentMutation.isPending || addLineMutation.isPending;

  if (loadingInvoice) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#D99B26]" />
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-[#1b2536]">
      {/* Customer + Ticket Info */}
      <div className="pb-5">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#D99B26]" />
              <p className="text-base font-bold text-white">{ticket.customer?.name ?? '—'}</p>
            </div>
            {ticket.customer?.phone && (
              <p className="text-xs text-[#64748B] pl-6">{ticket.customer.phone}</p>
            )}
          </div>
          <div className="text-right">
            {ticket.jobNumber && (
              <p className="text-xs font-mono font-semibold text-[#D99B26]">{ticket.jobNumber}</p>
            )}
            <p className="text-xs text-[#64748B] mt-0.5">{[ticket.brand, ticket.model].filter(Boolean).join(' ') || '—'}</p>
            <span className={`mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              ticket.status === 'READY_FOR_PICKUP'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {ticket.status === 'READY_FOR_PICKUP' ? 'Ready for pickup' : ticket.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Charges */}
      <div className="py-5 space-y-3">
        <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest">Charges</p>

        {lineItems.length === 0 ? (
          <p className="text-xs text-[#475569] italic">No charges added yet.</p>
        ) : (
          <div className="space-y-1.5">
            {lineItems.map((li: any, idx: number) => (
              <div key={li.id ?? idx} className="flex items-center justify-between group">
                <span className="text-sm text-[#CBD5E1]">{li.description}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">{fmt(li.lineTotal ?? li.unitPrice ?? 0)}</span>
                  {!isFinalized && (
                    <button
                      onClick={() => removeLineMutation.mutate({ ticketId: ticket.id, lineItemId: li.id })}
                      className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-red-400 transition text-xs"
                    >✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add item */}
        {!isFinalized && (
          showAddItem ? (
            <div className="flex gap-2 pt-1">
              <input
                autoFocus
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Item description"
                className="flex-1 h-9 px-3 bg-[#0d1322] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-[#475569] outline-none focus:border-[#D99B26]/50"
              />
              <input
                type="number"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                placeholder="₹ Price"
                className="w-24 h-9 px-3 bg-[#0d1322] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-[#475569] outline-none focus:border-[#D99B26]/50"
              />
              <button
                onClick={handleAddItem}
                disabled={addLineMutation.isPending}
                className="h-9 px-3 bg-[#D99B26] text-[#0d121c] rounded-lg text-xs font-bold transition hover:bg-[#c48c21]"
              >
                {addLineMutation.isPending ? '…' : 'Add'}
              </button>
              <button
                onClick={() => { setShowAddItem(false); setNewDesc(''); setNewPrice(''); }}
                className="h-9 px-2 text-[#475569] hover:text-white text-xs"
              >Cancel</button>
            </div>
          ) : (
            <button
              id="add-invoice-item-btn"
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#D99B26] transition mt-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add item
            </button>
          )
        )}

        {/* Totals */}
        {lineItems.length > 0 && (
          <div className="pt-3 space-y-1.5 border-t border-white/[0.05]">
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>Subtotal</span>
              <span>{fmt(totals?.subtotal ?? (invoiceData as any)?.subtotal ?? 0)}</span>
            </div>
            {parseFloat(totals?.tax ?? (invoiceData as any)?.tax ?? '0') > 0 && (
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Tax</span>
                <span>{fmt(totals?.tax ?? (invoiceData as any)?.tax ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/[0.05]">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Section */}
      <div className="pt-5 space-y-4">
        <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest">Payment</p>

        {amountPaid > 0 && (
          <div className="flex justify-between text-xs text-[#64748B]">
            <span>Previously Paid</span>
            <span className="text-emerald-400">{fmt(amountPaid)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm font-bold text-white">
          <span>Balance Due</span>
          <span className={balanceDue <= 0 ? 'text-emerald-400' : 'text-white'}>{fmt(Math.max(0, balanceDue))}</span>
        </div>

        {balanceDue > 0 && !isFinalized && (
          <>
            {/* Payment method */}
            <div className="flex gap-2">
              {([
                { id: 'CASH', label: 'Cash', Icon: Banknote },
                { id: 'UPI', label: 'UPI', Icon: QrCode },
                { id: 'CARD', label: 'Card', Icon: CreditCard },
              ] as const).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  id={`pay-method-${id.toLowerCase()}`}
                  onClick={() => setPayMethod(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition ${
                    payMethod === id
                      ? 'bg-[#D99B26]/15 border-[#D99B26]/50 text-[#D99B26]'
                      : 'border-white/[0.07] text-[#64748B] hover:text-white hover:border-white/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <button
              id="collect-payment-btn"
              onClick={handleCollectPayment}
              disabled={isBusy || lineItems.length === 0}
              className="w-full h-13 flex items-center justify-center gap-2 bg-[#D99B26] hover:bg-[#c48c21] disabled:opacity-50 disabled:cursor-not-allowed text-[#0d121c] font-bold text-sm rounded-2xl transition-all shadow-lg shadow-[#D99B26]/25 active:scale-[0.98] py-3.5"
            >
              {isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Collect {fmt(Math.max(0, balanceDue))}</>
              )}
            </button>
          </>
        )}

        {(isFinalized || balanceDue <= 0) && (
          <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">
              {balanceDue <= 0 ? 'Fully Paid' : 'Invoice Finalized'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main NewInvoicePage ───────────────────────────────────────────────────────
export const NewInvoicePage: React.FC<NewInvoicePageProps> = ({ onBack }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  return (
    <div className="min-h-screen bg-[#090e17] p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          id="new-invoice-back-btn"
          onClick={selectedTicket ? () => setSelectedTicket(null) : onBack}
          className="w-9 h-9 rounded-xl border border-white/[0.08] flex items-center justify-center text-[#64748B] hover:text-white hover:border-white/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">New Invoice</h1>
          {selectedTicket && (
            <p className="text-xs text-[#475569] mt-0.5">Review charges and collect payment</p>
          )}
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-[#1b2536] bg-[#101622] p-6">
        {!selectedTicket ? (
          <>
            <p className="text-sm font-semibold text-[#CBD5E1] mb-4">
              Search ticket, customer or phone number
            </p>
            <TicketSearchStep onSelect={setSelectedTicket} />
          </>
        ) : (
          <PaymentStep
            ticket={selectedTicket}
            onBack={() => setSelectedTicket(null)}
            onDone={onBack}
          />
        )}
      </div>
    </div>
  );
};
