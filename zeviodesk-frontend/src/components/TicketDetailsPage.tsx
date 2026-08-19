import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  User,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Hammer,
  Shield,
  FileText,
  Clock,
  MessageSquare,
  PackageSearch,
  Plus,
  PlayCircle,
  Loader2,
  X,
  ChevronDown,
  Receipt,
  Wrench,
  CheckCircle,
  CheckCircle2,
  Trash2,
  Check,
  Lock,
} from 'lucide-react';
import { Ticket } from '../lib/api';
import { formatTicketReference } from '../lib/ticketDisplay';
import { useUpdateTicketMutation, usePaymentsQuery, useCreatePaymentMutation, useLineItemsQuery, useAddLineItemMutation, useRemoveLineItemMutation } from '../hooks/useTicketsQuery';
import { useAppStore } from '../store/useAppStore';
import { PaymentType } from '../lib/api';
import { ConfirmationModal } from './ConfirmationModal';
import { navigate, ticketBillingPath } from '../lib/navigation';

type DetailsTab = 'description' | 'parts' | 'payments' | 'activity';

const tableShellClass =
  'overflow-x-auto rounded-lg border border-[#23314a]';
const tableClass = 'w-full text-left text-sm';
const theadClass = 'bg-[#161d2b] border-b border-[#23314a]';
const thClass = 'px-4 py-2.5 font-medium text-[#94A3B8] whitespace-nowrap';
const tbodyDivide = 'divide-y divide-[#23314a]';
const tdLabelClass = 'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#64748B] w-40 align-top';
const tdValueClass = 'px-4 py-3 text-[#CBD5E1] whitespace-pre-wrap';

interface TicketDetailsPageProps {
  ticket: Ticket;
  onBack: () => void;
  onEdit: (ticket: Ticket) => void;
}

function getPriorityStyle(priority: Ticket['priority']) {
  switch (priority) {
    case 'URGENT': return 'bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30';
    case 'WARRANTY': return 'bg-[#3B82F6]/20 text-[#93C5FD] border border-[#3B82F6]/30';
    case 'NORMAL': return 'bg-[#D99B26]/20 text-[#FCD34D] border border-[#D99B26]/30';
    default: return 'bg-[#1e293b] text-[#94a3b8]';
  }
}

function getStatusStyle(status: Ticket['status']) {
  switch (status) {
    case 'RECEIVED': return 'bg-[#1E3A8A]/30 text-[#93C5FD] border border-[#2563EB]/40';
    case 'DIAGNOSING': return 'bg-[#6D28D9]/30 text-[#C4B5FD] border border-[#7C3AED]/40';
    case 'WAITING_FOR_PARTS': return 'bg-[#B45309]/30 text-[#FCD34D] border border-[#D97706]/40';
    case 'IN_PROGRESS': return 'bg-[#CA8A04]/30 text-[#FEF08A] border border-[#EAB308]/40';
    case 'READY_FOR_PICKUP': return 'bg-[#15803D]/30 text-[#86EFAC] border border-[#16A34A]/40';
    case 'COMPLETED': return 'bg-[#047857]/30 text-[#6EE7B7] border border-[#059669]/40';
    case 'CANCELLED': return 'bg-[#334155]/30 text-[#94A3B8] border border-[#475569]/40';
    default: return 'bg-[#1e293b] text-[#94a3b8]';
  }
}

export const TicketDetailsPage: React.FC<TicketDetailsPageProps> = ({ ticket, onBack, onEdit }) => {
  const { showToast, currentUser } = useAppStore();
  const updateMutation = useUpdateTicketMutation();
  const isCompleted = ticket.status === 'COMPLETED' || ticket.status === 'CANCELLED';
  
  // Local state for parts
  const [newPartName, setNewPartName] = useState('');
  const [newPartDesc, setNewPartDesc] = useState('');
  const [newPartPrice, setNewPartPrice] = useState('');
  const [newPartQty, setNewPartQty] = useState('1');
  const [newPartDiscAmt, setNewPartDiscAmt] = useState('');
  const [newPartDiscPct, setNewPartDiscPct] = useState('');
  const [newPartTaxMode, setNewPartTaxMode] = useState<'NONE' | 'EXCLUSIVE' | 'INCLUSIVE'>('NONE');
  const [newPartTaxRate, setNewPartTaxRate] = useState('18');
  const [newPartWarranty, setNewPartWarranty] = useState(false);
  const [newPartWarrantyDuration, setNewPartWarrantyDuration] = useState('3');
  const [newPartWarrantyUnit, setNewPartWarrantyUnit] = useState('MONTHS');
  const [newPartWarrantyCoverage, setNewPartWarrantyCoverage] = useState('Full parts and labor warranty');
  const [recordPartPayment, setRecordPartPayment] = useState(false);
  const [isPartSplitPayment, setIsPartSplitPayment] = useState(false);
  const [partPaymentMethod, setPartPaymentMethod] = useState('CASH');
  const [partSingleAmount, setPartSingleAmount] = useState('');
  const [partUpiAmount, setPartUpiAmount] = useState('');
  const [partCardAmount, setPartCardAmount] = useState('');
  const [partCashAmount, setPartCashAmount] = useState('');
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);

  // Line items queries for Parts tab
  const { data: lineItems = [] } = useLineItemsQuery(ticket.id);
  const addLineMutation = useAddLineItemMutation();
  const removeLineMutation = useRemoveLineItemMutation();

  // Local state for payments
  const { data: payments = [] } = usePaymentsQuery(ticket.id);
  const createPaymentMutation = useCreatePaymentMutation();
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('PARTIAL');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [upiAmount, setUpiAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');

  // Local state for comments
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailsTab>('description');
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Partial<Record<DetailsTab, HTMLButtonElement | null>>>({});
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  const syncTabIndicator = useCallback(() => {
    const list = tabListRef.current;
    const activeEl = tabButtonRefs.current[activeTab];
    if (!list || !activeEl) return;
    const listRect = list.getBoundingClientRect();
    const tabRect = activeEl.getBoundingClientRect();
    setTabIndicator({
      left: tabRect.left - listRect.left + list.scrollLeft,
      width: tabRect.width,
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    syncTabIndicator();
    window.addEventListener('resize', syncTabIndicator);
    return () => window.removeEventListener('resize', syncTabIndicator);
  }, [syncTabIndicator]);

  const createdDate = new Date(ticket.createdAt).toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const statusLabel = ticket.status.replace(/_/g, ' ');

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await updateMutation.mutateAsync({
        id: ticket.id,
        data: { status: newStatus as any }
      });
      showToast(`Status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'warning');
    }
  };

  const handleAddPart = async () => {
    if (!newPartName.trim()) return;
    const price = parseFloat(newPartPrice) || 0;
    const qty = parseInt(newPartQty) || 1;
    const discAmt = parseFloat(newPartDiscAmt) || 0;
    const taxRate = parseFloat(newPartTaxRate) || 0;

    const fullDescription = newPartDesc.trim()
      ? `${newPartName.trim()} — ${newPartDesc.trim()}`
      : newPartName.trim();

    try {
      setIsAddingPart(true);
      await addLineMutation.mutateAsync({
        ticketId: ticket.id,
        data: {
          type: 'PART',
          description: fullDescription,
          unitPrice: price,
          quantity: qty,
          discountAmount: discAmt,
          taxMode: newPartTaxMode,
          taxRate: newPartTaxMode !== 'NONE' ? taxRate : 0,
          warrantyEnabled: newPartWarranty,
          warrantyDuration: newPartWarranty ? parseInt(newPartWarrantyDuration) || 3 : undefined,
          warrantyUnit: newPartWarranty ? (newPartWarrantyUnit as 'DAYS' | 'MONTHS' | 'YEARS') : undefined,
          warrantyCoverage: newPartWarranty && newPartWarrantyCoverage.trim() ? newPartWarrantyCoverage.trim() : undefined,
        }
      });

      // Automatically record part payment if enabled
      if (recordPartPayment) {
        if (isPartSplitPayment) {
          const upiVal = parseFloat(partUpiAmount) || 0;
          const cardVal = parseFloat(partCardAmount) || 0;
          const cashVal = parseFloat(partCashAmount) || 0;
          if (upiVal > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: { amount: upiVal, type: 'PARTS', method: 'UPI', notes: `Part payment: ${newPartName}` }
            });
          }
          if (cardVal > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: { amount: cardVal, type: 'PARTS', method: 'CARD', notes: `Part payment: ${newPartName}` }
            });
          }
          if (cashVal > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: { amount: cashVal, type: 'PARTS', method: 'CASH', notes: `Part payment: ${newPartName}` }
            });
          }
        } else {
          const singleVal = parseFloat(partSingleAmount) || 0;
          if (singleVal > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: { amount: singleVal, type: 'PARTS', method: partPaymentMethod, notes: `Part payment: ${newPartName}` }
            });
          }
        }
      }

      setNewPartName('');
      setNewPartDesc('');
      setNewPartPrice('');
      setNewPartQty('1');
      setNewPartDiscAmt('');
      setNewPartDiscPct('');
      setNewPartTaxMode('NONE');
      setNewPartTaxRate('18');
      setNewPartWarranty(false);
      setNewPartWarrantyDuration('3');
      setNewPartWarrantyUnit('MONTHS');
      setNewPartWarrantyCoverage('Full parts and labor warranty');
      setRecordPartPayment(false);
      setIsPartSplitPayment(false);
      setPartSingleAmount('');
      setPartUpiAmount('');
      setPartCardAmount('');
      setPartCashAmount('');
      setIsPartsModalOpen(false);
      showToast('Part added successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add part', 'warning');
    } finally {
      setIsAddingPart(false);
    }
  };

  const handleDeletePart = (partId: string) => {
    setPartToDelete(partId);
  };

  const confirmDeletePart = async () => {
    if (!partToDelete) return;
    try {
      await removeLineMutation.mutateAsync({
        ticketId: ticket.id,
        lineItemId: partToDelete,
      });
      showToast('Part removed successfully', 'success');
    } catch (err: any) {
      showToast('Failed to remove part', 'warning');
    } finally {
      setPartToDelete(null);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    const commentObj = {
      id: crypto.randomUUID(),
      type: 'comment',
      content: newComment,
      author: currentUser?.name || 'Unknown User',
      uploadedAt: new Date().toISOString()
    };

    const updatedAttachments = [...(ticket.attachments || []), commentObj];

    try {
      setIsSubmittingComment(true);
      await updateMutation.mutateAsync({
        id: ticket.id,
        data: { attachments: updatedAttachments }
      });
      setNewComment('');
      setIsActivityModalOpen(false);
      showToast('Comment added successfully', 'success');
    } catch (err: any) {
      showToast('Failed to add comment', 'warning');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Separate comments from actual file attachments if needed
  const comments = (ticket.attachments || []).filter(a => a.type === 'comment');

  const partsLineItems = lineItems.filter(item => item.type === 'PART');
  const totalPartsCost = partsLineItems.reduce((sum, p) => sum + parseFloat(String(p.lineTotal || 0)), 0);

  const handleRecordPayment = async () => {
    try {
      setIsRecordingPayment(true);
      if (isSplitPayment) {
        const upiVal = parseFloat(upiAmount) || 0;
        const cardVal = parseFloat(cardAmount) || 0;
        const cashVal = parseFloat(cashAmount) || 0;
        if (upiVal + cardVal + cashVal <= 0) {
          showToast('Enter an amount for at least one method', 'warning');
          setIsRecordingPayment(false);
          return;
        }
        if (upiVal > 0) {
          await createPaymentMutation.mutateAsync({ ticketId: ticket.id, data: { amount: upiVal, type: paymentType, method: 'UPI', notes: paymentNotes || undefined } });
        }
        if (cardVal > 0) {
          await createPaymentMutation.mutateAsync({ ticketId: ticket.id, data: { amount: cardVal, type: paymentType, method: 'CARD', notes: paymentNotes || undefined } });
        }
        if (cashVal > 0) {
          await createPaymentMutation.mutateAsync({ ticketId: ticket.id, data: { amount: cashVal, type: paymentType, method: 'CASH', notes: paymentNotes || undefined } });
        }
      } else {
        if (!paymentAmount || isNaN(parseFloat(paymentAmount))) {
          showToast('Enter a valid amount', 'warning');
          setIsRecordingPayment(false);
          return;
        }
        await createPaymentMutation.mutateAsync({
          ticketId: ticket.id,
          data: { amount: parseFloat(paymentAmount), type: paymentType, method: paymentMethod, notes: paymentNotes || undefined }
        });
      }
      setPaymentAmount('');
      setUpiAmount('');
      setCardAmount('');
      setCashAmount('');
      setPaymentNotes('');
      setIsPaymentModalOpen(false);
      showToast('Payment recorded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'warning');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const canGenerateInvoice = ['READY_FOR_PICKUP', 'COMPLETED'].includes(ticket.status) && 
                             ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADVISOR', 'MANAGER'].includes(currentUser?.role || '');

  return (
    <div className="min-h-screen bg-[#090e17] text-white flex flex-col">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-[#090e17]/95 backdrop-blur-sm border-b border-[#1b2536] px-5 py-4 sm:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1b2332] text-[#f0c65f] transition hover:bg-[#252e3f] cursor-pointer"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(ticket.status)}`}>
              {statusLabel}
            </span>
            <span className="text-[#64748B] font-mono text-sm border-l border-[#23314a] pl-3">
              #{formatTicketReference(ticket)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onEdit(ticket)}
            className="flex items-center gap-2 px-4 h-9 border border-[#23314a] hover:bg-[#1b2332] text-white font-medium rounded-lg text-sm transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-[#94A3B8]" />
            Edit
          </button>
          {canGenerateInvoice && (
            <button
              onClick={() => navigate(ticketBillingPath(ticket.id))}
              className="flex items-center gap-2 px-5 h-9 bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold rounded-lg text-sm transition-all shadow-lg shadow-[#D99B26]/20 cursor-pointer"
            >
              Billing & Invoice
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-[1440px] w-full mx-auto px-5 py-6 sm:px-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Main Content (Left Column) */}
        <div className="flex-1 w-full space-y-6">
          {/* Header Info */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{ticket.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#94A3B8]">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityStyle(ticket.priority)}`}>
                {ticket.priority} Priority
              </span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Created {createdDate}
              </div>
            </div>
          </div>

          {/* Tabbed tabular details */}
          <div className="bg-[#111726] border border-[#1b2536] rounded-xl overflow-hidden">
            <div
              ref={tabListRef}
              className="relative px-5 bg-[#141b2c] flex flex-wrap gap-x-1 border-b border-[#1b2536]"
            >
              <div
                className="absolute bottom-0 h-0.5 bg-[#D99B26] rounded-full transition-[left,width] duration-300 ease-out pointer-events-none z-10"
                style={{ left: tabIndicator.left, width: tabIndicator.width }}
                aria-hidden
              />
              {(
                [
                  { id: 'description' as const, label: 'Description & Issue', icon: FileText },
                  { id: 'parts' as const, label: 'Parts Required', icon: PackageSearch, count: (ticket.partsRequired || []).length },
                  { id: 'payments' as const, label: 'Payments', icon: IndianRupee, count: payments.length },
                  { id: 'activity' as const, label: 'Activity & Comments', icon: MessageSquare, count: comments.length },
                ] satisfies { id: DetailsTab; label: string; icon: typeof FileText; count?: number }[]
              ).map(({ id, label, icon: Icon, count }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    ref={(el) => {
                      tabButtonRefs.current[id] = el;
                      if (id === activeTab && el) {
                        requestAnimationFrame(() => syncTabIndicator());
                      }
                    }}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`relative inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#FCD34D]'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D99B26]' : ''}`} />
                    {label}
                    {count != null && count > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#23314a] text-[#CBD5E1]">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-5">
              {activeTab === 'description' && (
                <div className={tableShellClass}>
                  <table className={tableClass}>
                    <thead className={theadClass}>
                      <tr>
                        <th className={thClass}>Field</th>
                        <th className={thClass}>Details</th>
                      </tr>
                    </thead>
                    <tbody className={tbodyDivide}>
                      <tr className="hover:bg-[#141b2c]/50">
                        <td className={tdLabelClass}>Reported issue</td>
                        <td className={tdValueClass}>{ticket.reportedIssue || 'No issue reported.'}</td>
                      </tr>
                      <tr className="hover:bg-[#141b2c]/50">
                        <td className={tdLabelClass}>Description</td>
                        <td className={tdValueClass}>{ticket.description || '—'}</td>
                      </tr>
                      {ticket.internalNotes && (
                        <tr className="hover:bg-[#141b2c]/50">
                          <td className={tdLabelClass}>Internal notes</td>
                          <td className={tdValueClass}>{ticket.internalNotes}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'parts' && (
                <div className="space-y-5">
                  {partsLineItems.length > 0 ? (
                    <div className={tableShellClass}>
                      <table className={tableClass}>
                        <thead className={theadClass}>
                          <tr>
                            <th className={thClass}>Part name</th>
                            <th className={`${thClass} w-16 text-center`}>Qty</th>
                            <th className={`${thClass} w-24 text-right`}>Unit price</th>
                            <th className={`${thClass} w-24 text-right`}>Discount</th>
                            <th className={`${thClass} w-28 text-right`}>GST / Tax</th>
                            <th className={`${thClass} w-28 text-right`}>Line total</th>
                            <th className={`${thClass} w-12`} aria-label="Actions" />
                          </tr>
                        </thead>
                        <tbody className={tbodyDivide}>
                          {partsLineItems.map(part => (
                            <tr key={part.id} className="hover:bg-[#141b2c]/50">
                              <td className="px-4 py-3 font-medium text-[#CBD5E1]">{part.description}</td>
                              <td className="px-4 py-3 text-center text-[#94A3B8]">{parseFloat(String(part.quantity))}</td>
                              <td className="px-4 py-3 text-right text-[#94A3B8] font-mono">₹{parseFloat(String(part.unitPrice)).toFixed(2)}</td>
                              <td className="px-4 py-3 text-right text-red-400 font-mono">
                                {parseFloat(String(part.discountAmount || 0)) > 0 ? `-₹${parseFloat(String(part.discountAmount)).toFixed(2)}` : '—'}
                              </td>
                              <td className="px-4 py-3 text-right text-[#94A3B8] font-mono">
                                {part.taxMode !== 'NONE' ? `₹${parseFloat(String(part.taxAmount)).toFixed(2)} (${parseFloat(String(part.taxRate))}% ${part.taxMode})` : '—'}
                              </td>
                              <td className="px-4 py-3 text-right text-white font-mono font-semibold">
                                ₹{parseFloat(String(part.lineTotal)).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {!isCompleted && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePart(part.id)}
                                    className="text-[#64748B] hover:text-red-400 cursor-pointer"
                                    title="Remove part"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-[#141b2c]/40 font-semibold">
                            <td className="px-4 py-3 text-[#94A3B8]" colSpan={5}>
                              Parts subtotal
                            </td>
                            <td className="px-4 py-3 text-[#D99B26] font-mono text-right" colSpan={2}>
                              ₹{totalPartsCost.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#141b2c]/30 rounded-lg border border-dashed border-[#344056]">
                      <p className="text-sm text-[#64748B]">No parts in this ticket yet.</p>
                    </div>
                  )}


                  <div className="flex justify-end mt-4">
                    {isCompleted ? (
                      <div className="flex items-center justify-between w-full p-3 rounded-xl bg-[#141b2c] border border-[#1f293d] text-xs text-[#9CA3AF]">
                        <span className="flex items-center gap-2 font-semibold text-[#D99B26]">
                          <Lock className="w-4 h-4" /> Ticket Completed & Sealed
                        </span>
                        <span>Part line items are locked and cannot be added or modified.</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsPartsModalOpen(true)}
                        className="px-4 py-2 bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold text-sm rounded-md transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D99B26]/10"
                      >
                        <Plus className="w-4 h-4" /> Add Part
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (() => {
                const upiSum = payments.filter(p => p.method === 'UPI').reduce((s, p) => s + Number(p.amount || 0), 0);
                const cardSum = payments.filter(p => p.method === 'CARD').reduce((s, p) => s + Number(p.amount || 0), 0);
                const cashSum = payments.filter(p => p.method === 'CASH').reduce((s, p) => s + Number(p.amount || 0), 0);
                const totalPaid = Number(ticket.amountPaid || ticket.advanceDeposit || 0);
                const balanceDue = Math.max(0, Number(ticket.balanceDue ?? ((ticket.totalAmount ?? ((ticket.estimatedCost || 0) + totalPartsCost)) - totalPaid)));
                return (
                  <div className="space-y-5">
                    {/* Payment Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'UPI / QR', value: upiSum, color: 'text-[#38BDF8]' },
                        { label: 'Card / POS', value: cardSum, color: 'text-[#A78BFA]' },
                        { label: 'Cash', value: cashSum, color: 'text-[#34D399]' },
                        { label: 'Balance Due', value: balanceDue, color: balanceDue > 0 ? 'text-[#F87171]' : 'text-[#34D399]' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-[#141b2c] border border-[#23314a] rounded-xl p-3 space-y-1">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">{label}</span>
                          <span className={`font-mono font-bold text-sm ${color}`}>₹{value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className={tableShellClass}>
                      <table className={tableClass}>
                        <thead className={theadClass}>
                          <tr>
                            <th className={thClass}>Date</th>
                            <th className={thClass}>Type</th>
                            <th className={thClass}>Method</th>
                            <th className={thClass}>Notes</th>
                            <th className={`${thClass} text-right`}>Amount</th>
                          </tr>
                        </thead>
                        <tbody className={tbodyDivide}>
                          {payments.length === 0 && !ticket.advanceDeposit ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-[#64748B]">
                                No payments recorded yet.
                              </td>
                            </tr>
                          ) : (
                            <>
                              {payments.length === 0 && ticket.advanceDeposit && (
                                <tr className="hover:bg-[#141b2c]/50">
                                  <td className="px-4 py-3 text-[#94A3B8]">{createdDate}</td>
                                  <td className="px-4 py-3 text-white"><span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#D99B26]/20 text-[#D99B26]">LEGACY ADVANCE</span></td>
                                  <td className="px-4 py-3 text-[#94A3B8]">UNKNOWN</td>
                                  <td className="px-4 py-3 text-[#94A3B8]">—</td>
                                  <td className="px-4 py-3 text-right text-white font-mono">₹{Number(ticket.advanceDeposit || 0).toFixed(2)}</td>
                                </tr>
                              )}
                              {payments.map(payment => (
                                <tr key={payment.id} className="hover:bg-[#141b2c]/50">
                                  <td className="px-4 py-3 text-[#94A3B8]">
                                    {new Date(payment.paidAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-4 py-3 text-white">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                      payment.type === 'ADVANCE' ? 'bg-[#3B82F6]/20 text-[#93C5FD]' :
                                      payment.type === 'PARTS' ? 'bg-[#8B5CF6]/20 text-[#C4B5FD]' :
                                      payment.type === 'FINAL' ? 'bg-[#10B981]/20 text-[#6EE7B7]' :
                                      payment.type === 'REFUND' ? 'bg-[#EF4444]/20 text-[#F87171]' :
                                      'bg-[#D99B26]/20 text-[#FCD34D]'
                                    }`}>
                                      {payment.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-[#94A3B8]">{payment.method || '—'}</td>
                                  <td className="px-4 py-3 text-[#94A3B8]">{payment.notes || '—'}</td>
                                  <td className={`px-4 py-3 text-right font-mono ${payment.type === 'REFUND' ? 'text-[#F87171]' : 'text-[#86EFAC]'}`}>
                                    {payment.type === 'REFUND' ? '-' : '+'}₹{Number(payment.amount || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}
                          <tr className="bg-[#141b2c]/40 font-semibold">
                            <td className="px-4 py-3 text-[#94A3B8] text-right" colSpan={4}>Total Paid</td>
                            <td className="px-4 py-3 text-[#10B981] font-mono text-right">₹{totalPaid.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end mt-4">
                      {isCompleted ? (
                        <div className="flex items-center justify-between w-full p-3 rounded-xl bg-[#141b2c] border border-[#1f293d] text-xs text-[#9CA3AF]">
                          <span className="flex items-center gap-2 font-semibold text-[#D99B26]">
                            <Lock className="w-4 h-4" /> Ticket Completed & Sealed
                          </span>
                          <span>Payment records are locked and cannot be added or modified.</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="px-4 py-2 bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold text-sm rounded-md transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D99B26]/10"
                        >
                          <Plus className="w-4 h-4" /> Add Payment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'activity' && (
                <div className="space-y-5">
                  <div className={tableShellClass}>
                    <table className={tableClass}>
                      <thead className={theadClass}>
                        <tr>
                          <th className={`${thClass} w-36`}>Author</th>
                          <th className={`${thClass} w-44`}>Date</th>
                          <th className={thClass}>Comment</th>
                        </tr>
                      </thead>
                      <tbody className={tbodyDivide}>
                        {comments.length > 0 ? (
                          comments.map(comment => (
                            <tr key={comment.id} className="hover:bg-[#141b2c]/50 align-top">
                              <td className="px-4 py-3 text-sm font-medium text-white">
                                {comment.author || 'Unknown'}
                              </td>
                              <td className="px-4 py-3 text-xs text-[#64748B] font-mono whitespace-nowrap">
                                {new Date(comment.uploadedAt).toLocaleString()}
                              </td>
                              <td className={`${tdValueClass} text-sm`}>{comment.content}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-4 py-8 text-center text-sm text-[#64748B]" colSpan={3}>
                              No comments yet. Post an update below.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => setIsActivityModalOpen(true)}
                      className="px-4 py-2 bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] font-bold text-sm rounded-md transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D99B26]/10"
                    >
                      <Plus className="w-4 h-4" /> Add Comment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Metadata) */}
        <div className="w-full lg:w-80 shrink-0 space-y-5">
          
          {/* People Card */}
          <div className="bg-[#111726] border border-[#1b2536] rounded-xl p-5 space-y-5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#23314a] pb-3">
              <User className="w-4 h-4 text-[#94A3B8]" /> People
            </h4>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider block mb-2">Assignee</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1b2332] rounded-full flex items-center justify-center border border-[#23314a] shrink-0">
                    {ticket.assignedTo ? (
                      <span className="text-xs font-bold text-[#D99B26]">{ticket.assignedTo.name.slice(0, 2).toUpperCase()}</span>
                    ) : (
                      <User className="w-4 h-4 text-[#64748B]" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white block">{ticket.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider block mb-2">Customer / Reporter</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1b2332] rounded-full flex items-center justify-center border border-[#23314a] shrink-0">
                    <span className="text-xs font-bold text-white">
                      {(ticket.customer?.name || 'W').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white block">{ticket.customer?.name || 'Walk-in'}</span>
                    {ticket.customer?.phone && (
                      <span className="text-xs text-[#94A3B8] font-mono">{ticket.customer.phone}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Device Info Card */}
          <div className="bg-[#111726] border border-[#1b2536] rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#23314a] pb-3">
              <Hammer className="w-4 h-4 text-[#94A3B8]" /> Device
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-[#64748B] shrink-0">Category</span>
                <span className="text-sm text-white font-medium text-right">{ticket.itemCategory || '—'}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-[#64748B] shrink-0">Model</span>
                <span className="text-sm text-white font-medium text-right">{[ticket.brand, ticket.model].filter(Boolean).join(' ') || '—'}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-[#64748B] shrink-0">Serial</span>
                <span className="text-xs text-[#CBD5E1] font-mono text-right break-all">{ticket.serialNumber || '—'}</span>
              </div>
            </div>
          </div>

          {/* Financials Card */}
          <div className="bg-[#111726] border border-[#1b2536] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#23314a] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-[#94A3B8]" /> Financials
              </h4>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                ticket.paymentStatus === 'PAID' ? 'bg-[#10B981]/20 text-[#6EE7B7]' :
                ticket.paymentStatus === 'PARTIAL' ? 'bg-[#D99B26]/20 text-[#FCD34D]' :
                'bg-[#EF4444]/20 text-[#F87171]'
              }`}>
                {ticket.paymentStatus || 'UNPAID'}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#64748B]">Total Bill</span>
                <span className="text-white font-mono">
                  ₹{ticket.totalAmount != null ? Number(ticket.totalAmount).toFixed(2) : Number((ticket.estimatedCost || 0) + totalPartsCost).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#64748B]">Amount Paid</span>
                <span className="text-[#10B981] font-mono">
                  ₹{Number(ticket.amountPaid || ticket.advanceDeposit || 0).toFixed(2)}
                </span>
              </div>
              <div className="pt-3 border-t border-[#23314a] flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Balance Due</span>
                <span className={`font-mono font-bold ${ticket.balanceDue === 0 ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
                  ₹{Math.max(0, Number(ticket.balanceDue ?? ((ticket.totalAmount ?? ((ticket.estimatedCost || 0) + totalPartsCost)) - (ticket.amountPaid || ticket.advanceDeposit || 0)))).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Parts Modal */}
      {isPartsModalOpen && (() => {
        const qty = parseFloat(newPartQty) || 1;
        const price = parseFloat(newPartPrice) || 0;
        const discAmt = parseFloat(newPartDiscAmt) || 0;
        const taxRate = parseFloat(newPartTaxRate) || 0;
        const subtotalBeforeDisc = qty * price;
        const afterDisc = subtotalBeforeDisc - discAmt;
        const taxAmount = newPartTaxMode === 'EXCLUSIVE' ? afterDisc * (taxRate / 100) : 0;
        const lineTotal = afterDisc + taxAmount;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-[#111827] border border-[#1f293d] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-[#1f293d] flex items-center justify-between shrink-0">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PackageSearch className="w-5 h-5 text-[#D99B26]" /> Add Part / Hardware
                </h3>
                <button onClick={() => setIsPartsModalOpen(false)} className="text-[#9CA3AF] hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {/* Part Name & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                      Part / Hardware Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={newPartName}
                      onChange={e => setNewPartName(e.target.value)}
                      placeholder="e.g. iPhone 13 OLED Display"
                      className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white placeholder:text-[#4B5563] focus:border-[#D99B26] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                      Description / Remarks
                    </label>
                    <input
                      value={newPartDesc}
                      onChange={e => setNewPartDesc(e.target.value)}
                      placeholder="e.g. Original Grade A Replacement Screen"
                      className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white placeholder:text-[#4B5563] focus:border-[#D99B26] outline-none"
                    />
                  </div>
                </div>

                {/* Qty, Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Quantity</label>
                    <input
                      type="number" min="1"
                      value={newPartQty}
                      onChange={e => setNewPartQty(e.target.value)}
                      className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white focus:border-[#D99B26] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Unit Price (₹)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={newPartPrice}
                      onChange={e => setNewPartPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white placeholder:text-[#4B5563] focus:border-[#D99B26] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Disc Amt, Disc % */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Disc. Amt (₹)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={newPartDiscAmt}
                      onChange={e => {
                        setNewPartDiscAmt(e.target.value);
                        const base = (parseFloat(newPartQty) || 1) * (parseFloat(newPartPrice) || 0);
                        const dAmt = parseFloat(e.target.value) || 0;
                        if (base > 0) setNewPartDiscPct(((dAmt / base) * 100).toFixed(2));
                      }}
                      placeholder="0.00"
                      className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white placeholder:text-[#4B5563] focus:border-[#D99B26] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Disc. (%)</label>
                    <input
                      type="number" min="0" max="100" step="0.01"
                      value={newPartDiscPct}
                      onChange={e => {
                        setNewPartDiscPct(e.target.value);
                        const base = (parseFloat(newPartQty) || 1) * (parseFloat(newPartPrice) || 0);
                        const pct = parseFloat(e.target.value) || 0;
                        setNewPartDiscAmt((base * pct / 100).toFixed(2));
                      }}
                      placeholder="0"
                      className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white placeholder:text-[#4B5563] focus:border-[#D99B26] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Tax */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Tax</label>
                    <select
                      value={newPartTaxMode}
                      onChange={e => setNewPartTaxMode(e.target.value as any)}
                      className="w-full h-[50px] pl-4 pr-10 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white focus:border-[#D99B26] outline-none appearance-none"
                    >
                      <option value="NONE">No Tax (0%)</option>
                      <option value="EXCLUSIVE">+ GST (Exclusive)</option>
                      <option value="INCLUSIVE">GST Inclusive</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-[calc(50%+10px)] -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                  </div>
                  {newPartTaxMode !== 'NONE' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">GST Rate (%)</label>
                      <input
                        type="number" min="0" step="0.1"
                        value={newPartTaxRate}
                        onChange={e => setNewPartTaxRate(e.target.value)}
                        placeholder="18"
                        className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white focus:border-[#D99B26] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  )}
                </div>

                {/* Warranty Section */}
                <div className="bg-[#182030] p-4 rounded-xl border border-[#1f293d] space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative flex items-center justify-center shrink-0">
                      <input
                        type="checkbox"
                        checked={newPartWarranty}
                        onChange={e => setNewPartWarranty(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border border-[#2d3b54] bg-[#111827] peer-checked:bg-[#D99B26] peer-checked:border-[#D99B26] transition flex items-center justify-center">
                        {newPartWarranty && <Check className="w-3.5 h-3.5 text-[#0d121c] stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white">Apply Specific Warranty Coverage</span>
                  </label>

                  {newPartWarranty && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Duration</label>
                          <input
                            type="number" min="1"
                            value={newPartWarrantyDuration}
                            onChange={e => setNewPartWarrantyDuration(e.target.value)}
                            className="w-full h-[50px] px-4 rounded-xl bg-[#111827] border border-[#2d3b54] text-sm text-white focus:border-[#D99B26] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="relative">
                          <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Unit</label>
                          <select
                            value={newPartWarrantyUnit}
                            onChange={e => setNewPartWarrantyUnit(e.target.value)}
                            className="w-full h-[50px] pl-4 pr-10 rounded-xl bg-[#111827] border border-[#2d3b54] text-sm text-white focus:border-[#D99B26] outline-none appearance-none cursor-pointer"
                          >
                            <option value="DAYS">Days</option>
                            <option value="MONTHS">Months</option>
                            <option value="YEARS">Years</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-[calc(50%+10px)] -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Warranty Coverage & Notes</label>
                        <input
                          type="text"
                          value={newPartWarrantyCoverage}
                          onChange={e => setNewPartWarrantyCoverage(e.target.value)}
                          placeholder="e.g. Full parts and labor coverage, excludes liquid damage"
                          className="w-full h-[50px] px-4 rounded-xl bg-[#111827] border border-[#2d3b54] text-sm text-white focus:border-[#D99B26] outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Received / Advance Recording for Part */}
                <div className="bg-[#182030] p-4 rounded-xl border border-[#1f293d] space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative flex items-center justify-center shrink-0">
                      <input
                        type="checkbox"
                        checked={recordPartPayment}
                        onChange={e => setRecordPartPayment(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border border-[#2d3b54] bg-[#111827] peer-checked:bg-[#D99B26] peer-checked:border-[#D99B26] transition flex items-center justify-center">
                        {recordPartPayment && <Check className="w-3.5 h-3.5 text-[#0d121c] stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white">Record Amount Received / Advance for Part</span>
                  </label>

                  {recordPartPayment && (
                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div className="relative flex items-center justify-center shrink-0">
                          <input
                            type="checkbox"
                            checked={isPartSplitPayment}
                            onChange={e => setIsPartSplitPayment(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-4 h-4 rounded border border-[#2d3b54] bg-[#111827] peer-checked:bg-[#D99B26] peer-checked:border-[#D99B26] transition flex items-center justify-center">
                            {isPartSplitPayment && <Check className="w-3 h-3 text-[#0d121c] stroke-[3]" />}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#D99B26]">Split Payment (UPI / Card / Cash)</span>
                      </label>

                      {isPartSplitPayment ? (
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-[#9CA3AF] mb-1">UPI / QR (₹)</label>
                            <input
                              type="number" min="0" step="0.01"
                              value={partUpiAmount}
                              onChange={e => setPartUpiAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full h-10 px-3 bg-[#111827] border border-[#2d3b54] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-[#9CA3AF] mb-1">Card (₹)</label>
                            <input
                              type="number" min="0" step="0.01"
                              value={partCardAmount}
                              onChange={e => setPartCardAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full h-10 px-3 bg-[#111827] border border-[#2d3b54] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-[#9CA3AF] mb-1">Cash (₹)</label>
                            <input
                              type="number" min="0" step="0.01"
                              value={partCashAmount}
                              onChange={e => setPartCashAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full h-10 px-3 bg-[#111827] border border-[#2d3b54] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">Amount (₹)</label>
                            <input
                              type="number" min="0" step="0.01"
                              value={partSingleAmount}
                              onChange={e => setPartSingleAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full h-10 px-3 bg-[#111827] border border-[#2d3b54] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <div className="relative">
                            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">Method</label>
                            <select
                              value={partPaymentMethod}
                              onChange={e => setPartPaymentMethod(e.target.value)}
                              className="w-full h-10 pl-3 pr-8 bg-[#111827] border border-[#2d3b54] rounded-xl text-xs text-white outline-none appearance-none cursor-pointer"
                            >
                              <option value="CASH">Cash</option>
                              <option value="CARD">Card / POS</option>
                              <option value="UPI">UPI / Digital</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-[calc(50%+6px)] -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Live Total Calculation */}
                <div className="bg-[#182030] rounded-xl border border-[#1f293d] p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#9CA3AF]">
                    <span>Subtotal (Qty × Price)</span>
                    <span className="text-white">₹{subtotalBeforeDisc.toFixed(2)}</span>
                  </div>
                  {discAmt > 0 && (
                    <div className="flex justify-between text-[#9CA3AF]">
                      <span>Discount</span>
                      <span className="text-white">−₹{discAmt.toFixed(2)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-[#9CA3AF]">
                      <span>GST ({taxRate}%)</span>
                      <span className="text-white">+₹{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#1f293d] pt-2 flex justify-between font-bold text-sm">
                    <span className="text-white">Line Total</span>
                    <span className="text-[#D99B26]">₹{lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[#1f293d] flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setIsPartsModalOpen(false)}
                  className="h-[50px] px-8 rounded-xl text-sm font-bold text-[#9CA3AF] hover:text-white hover:bg-[#182030] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPart}
                  disabled={isAddingPart || !newPartName.trim()}
                  className="h-[50px] px-8 rounded-xl text-sm font-bold bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isAddingPart && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Part
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1f293d] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#1f293d] flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-[#D99B26]" /> Record Payment
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-[#9CA3AF] hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Type */}
              <div className="relative">
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Payment Type</label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value as PaymentType)}
                  className="w-full h-[50px] pl-4 pr-10 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white focus:border-[#D99B26] outline-none appearance-none"
                >
                  <option value="ADVANCE">Advance</option>
                  <option value="PARTS">Parts</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="FINAL">Final Balance</option>
                  <option value="REFUND">Refund</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-[calc(50%+10px)] -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              </div>

              {/* Split Payment Toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative flex items-center justify-center shrink-0">
                  <input
                    type="checkbox"
                    checked={isSplitPayment}
                    onChange={e => setIsSplitPayment(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded border border-[#2d3b54] bg-[#111827] peer-checked:bg-[#D99B26] peer-checked:border-[#D99B26] transition flex items-center justify-center">
                    {isSplitPayment && <Check className="w-3.5 h-3.5 text-[#0d121c] stroke-[3]" />}
                  </div>
                </div>
                <span className="text-sm font-semibold text-white">Split Payment (UPI / Card / Cash)</span>
              </label>

              {isSplitPayment ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">UPI / QR (₹)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={upiAmount}
                        onChange={e => setUpiAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white placeholder:text-[#4B5563] focus:border-[#D99B26] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Card (₹)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={cardAmount}
                        onChange={e => setCardAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white placeholder:text-[#4B5563] focus:border-[#D99B26] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Cash (₹)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={cashAmount}
                        onChange={e => setCashAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white placeholder:text-[#4B5563] focus:border-[#D99B26] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  {/* Split Total */}
                  <div className="bg-[#182030] rounded-xl border border-[#1f293d] p-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">Split Total</span>
                    <span className="font-mono font-bold text-sm text-[#D99B26]">
                      ₹{((parseFloat(upiAmount) || 0) + (parseFloat(cardAmount) || 0) + (parseFloat(cashAmount) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Amount (₹)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white placeholder:text-[#4B5563] focus:border-[#D99B26] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full h-[50px] pl-4 pr-10 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white focus:border-[#D99B26] outline-none appearance-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card / POS</option>
                      <option value="UPI">UPI / Digital</option>
                      <option value="TRANSFER">Bank Transfer</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-[calc(50%+10px)] -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">Notes (Optional)</label>
                <input
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="e.g. advance for LCD"
                  className="w-full h-[50px] px-4 rounded-xl bg-[#182030] border border-[#1f293d] text-sm text-white placeholder:text-[#4B5563] focus:border-[#D99B26] outline-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1f293d] flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="h-[50px] px-8 rounded-xl text-sm font-bold text-[#9CA3AF] hover:text-white hover:bg-[#182030] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={isRecordingPayment}
                className="h-[50px] px-8 rounded-xl text-sm font-bold bg-[#D99B26] hover:bg-[#E5A93C] text-[#0d121c] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isRecordingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity/Comment Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#101622] border border-[#1b2536] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#1b2536] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#3B82F6]" /> Add Comment
              </h3>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="text-[#64748B] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Comment <span className="text-red-500">*</span></label>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment or status update..."
                className="w-full min-h-[120px] p-3 rounded-md bg-[#0c1017] border border-[#344056] text-sm text-white focus:border-[#3B82F6] outline-none resize-y"
              />
            </div>
            <div className="px-6 py-4 border-t border-[#1b2536] bg-[#141b2c] flex justify-end gap-3">
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-white hover:bg-[#1b2536] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={isSubmittingComment || !newComment.trim()}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-lg shadow-[#3B82F6]/10"
              >
                {isSubmittingComment && <Loader2 className="w-4 h-4 animate-spin" />}
                Post Comment
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!partToDelete}
        title="Remove Part"
        message="Are you sure you want to remove this part? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDeletePart}
        onCancel={() => setPartToDelete(null)}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
};
