import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  Check,
  Lock,
  Package,
  Truck,
  Trash2,
  AlertTriangle,
  Folder,
  Image as ImageIcon,
  Maximize2,
  Link,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Ticket } from '../lib/api';
import { formatTicketReference } from '../lib/ticketDisplay';
import { useUpdateTicketMutation, useCompleteRepairMutation, usePaymentsQuery, useCreatePaymentMutation, useDeletePaymentMutation, useLineItemsQuery, useAddLineItemMutation, useRemoveLineItemMutation } from '../hooks/useTicketsQuery';
import { useAppStore } from '../store/useAppStore';
import { PaymentType, Payment } from '../lib/api';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { navigate, ticketBillingPath } from '../lib/navigation';
import { Drawer } from '../components/ui/Drawer';
import { AttachmentUploader } from '../components/attachments/AttachmentUploader';
import { PartSearchCombo } from '../components/PartSearchCombo';
import { useInvoicingSettingsQuery } from '../hooks/useInvoicesQuery';
import { calculateTax } from '../lib/tax';
import { TicketDetailsSkeleton } from '../components/TicketDetailsSkeleton';
import { WarrantyModal } from '../components/WarrantyModal';
import { StatusBadge } from '../components/StatusBadge';

import { TicketDetailsHeader } from '../components/ticket-details/TicketDetailsHeader';
import { TicketDescriptionTab } from '../components/ticket-details/TicketDescriptionTab';
import { TicketPartsTab } from '../components/ticket-details/TicketPartsTab';
import { TicketPaymentsTab } from '../components/ticket-details/TicketPaymentsTab';
import { TicketAttachmentsTab } from '../components/ticket-details/TicketAttachmentsTab';
import { TicketActivityTab } from '../components/ticket-details/TicketActivityTab';

type DetailsTab = 'description' | 'parts' | 'payments' | 'files' | 'activity';

const tableShellClass =
  'overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-xs';
const tableClass = 'w-full text-left text-sm';
const theadClass = 'bg-[#f8fafc] border-b border-[#e2e8f0]';
const thClass = 'px-4 py-3 font-bold text-xs tracking-wider uppercase text-[#64748b] whitespace-nowrap';
const tbodyDivide = 'divide-y divide-[#e2e8f0]';
const tdLabelClass = 'px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#64748b] w-44 align-top bg-[#f8fafc] border-r border-[#e2e8f0]';
const tdValueClass = 'px-4 py-3 text-[#1e293b] font-medium bg-white whitespace-pre-wrap';

function computeWarrantyExpiry(duration: number, unit: string, startDate: Date = new Date()): string {
  const d = new Date(startDate);
  const u = (unit || '').toUpperCase();
  const dur = Math.max(1, duration || 1);
  if (u.includes('DAY')) {
    d.setDate(d.getDate() + dur);
  } else if (u.includes('MONTH')) {
    d.setMonth(d.getMonth() + dur);
  } else if (u.includes('YEAR')) {
    d.setFullYear(d.getFullYear() + dur);
  }
  return d.toISOString().split('T')[0];
}

interface TicketDetailsPageProps {
  ticket?: Ticket;
  isLoading?: boolean;
  onBack: () => void;
  onEdit?: (ticket: Ticket) => void;
}

function getPriorityStyle(priority: Ticket['priority']) {
  switch (priority) {
    case 'URGENT': return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'NORMAL':
    default: return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
}

function getStatusStyle(status: Ticket['status']) {
  switch (status) {
    case 'RECEIVED': return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'DIAGNOSING': return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'WAITING_FOR_PARTS': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'IN_PROGRESS': return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'READY_FOR_PICKUP': return 'bg-teal-50 text-teal-700 border border-teal-200';
    case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'CANCELLED': return 'bg-rose-50 text-rose-700 border border-rose-200';
    default: return 'bg-gray-50 text-gray-700 border border-gray-200';
  }
}

export const TicketDetailsPage: React.FC<TicketDetailsPageProps> = ({ ticket, isLoading, onBack, onEdit }) => {
  if (isLoading || !ticket) {
    return <TicketDetailsSkeleton onBack={onBack} />;
  }

  const { showToast, currentUser } = useAppStore();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateTicketMutation();
  const isCompleted = ticket.status === 'COMPLETED' || ticket.status === 'DELIVERED' || ticket.status === 'CANCELLED';

  // Local state for parts
  const [newPartName, setNewPartName] = useState('');
  const [newPartDesc, setNewPartDesc] = useState('');
  const [newPartBrand, setNewPartBrand] = useState('');
  const [newPartSupplier, setNewPartSupplier] = useState('');
  const [newPartHsnCode, setNewPartHsnCode] = useState('');
  const [newPartPrice, setNewPartPrice] = useState('');
  const [newPartQty, setNewPartQty] = useState('1');
  const [newPartCost, setNewPartCost] = useState(''); // Acquisition cost state
  const [newPartInventoryItemId, setNewPartInventoryItemId] = useState<string | null>(null); // Track inventory item link
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [discountVal, setDiscountVal] = useState('');
  const [newPartDiscAmt, setNewPartDiscAmt] = useState('');
  const [newPartDiscPct, setNewPartDiscPct] = useState('');
  const [newPartTaxMode, setNewPartTaxMode] = useState<'NONE' | 'EXCLUSIVE' | 'INCLUSIVE'>('INCLUSIVE');
  const [newPartTaxRate, setNewPartTaxRate] = useState('18');
  const [newPartWarranty, setNewPartWarranty] = useState(false);
  const [hasWarrantyToggle, setHasWarrantyToggle] = useState(false);
  const [simpleWarrantyDuration, setSimpleWarrantyDuration] = useState<number>(90);
  const [simpleWarrantyUnit, setSimpleWarrantyUnit] = useState<'Days' | 'Months' | 'Years'>('Days');
  const [newPartWarrantyDuration, setNewPartWarrantyDuration] = useState('3');
  const [newPartWarrantyUnit, setNewPartWarrantyUnit] = useState('MONTHS');
  const { data: invoicingSettings } = useInvoicingSettingsQuery();
  const isInventoryEnabled = invoicingSettings?.inventoryEnabled ?? true;

  // Warranties list state for Add Part drawer
  interface PartWarrantyItem {
    id: string;
    type: string;
    provider: string;
    duration: number;
    unit: 'Days' | 'Months' | 'Years';
    expiryDate?: string;
    notes?: string;
    attachmentIds?: string[];
    docFileName?: string;
  }

  const [addPartMode, setAddPartMode] = useState<'CATALOG' | 'MANUAL'>('CATALOG');
  const [showAdvancedCatalogOptions, setShowAdvancedCatalogOptions] = useState(false);
  const [warrantiesList, setWarrantiesList] = useState<PartWarrantyItem[]>([]);
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);

  const [hasShopWarranty, setHasShopWarranty] = useState<boolean>(true);
  const [shopWarrantyDuration, setShopWarrantyDuration] = useState<string>('90');
  const [shopWarrantyUnit, setShopWarrantyUnit] = useState<string>('DAYS');
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
  const deletePaymentMutation = useDeletePaymentMutation();
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const partToDeleteObj = useMemo(() => {
    if (!partToDelete || !lineItems) return null;
    return lineItems.find((li: any) => li.id === partToDelete) || null;
  }, [partToDelete, lineItems]);

  const associatedPartPaymentAmount = useMemo(() => {
    if (!partToDeleteObj || !payments || payments.length === 0) return 0;
    const descLower = (partToDeleteObj.description || '').toLowerCase();
    const partPayments = payments.filter((p: any) => p.type === 'PARTS');

    const matched = partPayments.filter((p: any) => {
      if (!p.notes) return false;
      const noteLower = p.notes.toLowerCase();
      return (
        noteLower.includes(descLower) ||
        descLower.includes(noteLower.replace('part payment:', '').trim())
      );
    });

    if (matched.length > 0) {
      return matched.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    }

    const partItems = lineItems.filter((li: any) => li.type === 'PART');
    if (partPayments.length > 0 && partItems.length === 1) {
      return partPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    }

    return 0;
  }, [partToDeleteObj, payments, lineItems]);

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

  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isReadyForPickupModalOpen, setIsReadyForPickupModalOpen] = useState(false);
  const [isReadySuccessModalOpen, setIsReadySuccessModalOpen] = useState(false);
  const [customerNoteForPickup, setCustomerNoteForPickup] = useState('');
  const updateTicketMutation = useUpdateTicketMutation();
  const completeRepairMutation = useCompleteRepairMutation();
  const isTechnician = currentUser?.role === 'TECHNICIAN';

  const handleOpenReadyForPickupModal = () => {
    setIsReadyForPickupModalOpen(true);
  };

  const handleConfirmReadyForPickup = async () => {
    if (isTechnician) {
      showToast('Technicians cannot set status to Ready for Pickup.', 'warning');
      return;
    }

    try {
      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        data: {
          status: 'READY_FOR_PICKUP',
          customerNote: customerNoteForPickup.trim() || 'Device repair complete. Ready for pickup at service center.',
        },
      });
      setIsReadyForPickupModalOpen(false);
      setIsReadySuccessModalOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to update status to Ready for Pickup', 'warning');
    }
  };

  const handleCopyTrackingLink = () => {
    const token = (ticket as any).trackingToken || ticket.publicToken || ticket.id;
    const trackingUrl = `${window.location.origin}/track/${token}`;
    navigator.clipboard.writeText(trackingUrl);
    setIsLinkCopied(true);
    showToast('✓ Tracking link copied to clipboard!', 'success');
    setTimeout(() => setIsLinkCopied(false), 2500);
  };

  const createdDate = ticket?.createdAt
    ? new Date(ticket.createdAt).toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
    : '';
  const statusLabel = (ticket?.status || 'RECEIVED').replace(/_/g, ' ');

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
    const priceNum = parseFloat(newPartPrice) || 0;
    const qtyNum = parseInt(newPartQty) || 1;
    const cost = parseFloat(newPartCost) || 0;
    const taxRate = parseFloat(newPartTaxRate) || 0;

    const baseTotal = qtyNum * priceNum;
    const valNum = parseFloat(discountVal) || 0;

    let finalDiscAmt = 0;
    if (baseTotal > 0 && valNum > 0) {
      if (discountType === 'AMOUNT') {
        finalDiscAmt = valNum;
      } else {
        finalDiscAmt = (valNum / 100) * baseTotal;
      }
    }

    const warrantyEnabled = hasWarrantyToggle || warrantiesList.length > 0;
    let durNum = simpleWarrantyDuration;
    let unitVal: 'DAYS' | 'MONTHS' | 'YEARS' = (simpleWarrantyUnit.toUpperCase() as any) || 'DAYS';

    if (warrantiesList.length > 0) {
      const firstW = warrantiesList[0];
      durNum = firstW.duration;
      unitVal = (firstW.unit.toUpperCase() as any) || 'DAYS';
    }

    let extraDetails: string[] = [];
    if (newPartBrand.trim()) extraDetails.push(`Brand: ${newPartBrand.trim()}`);
    if (newPartSupplier.trim()) extraDetails.push(`Supplier: ${newPartSupplier.trim()}`);
    if (newPartHsnCode.trim()) extraDetails.push(`HSN: ${newPartHsnCode.trim()}`);
    if (newPartDesc.trim()) extraDetails.push(newPartDesc.trim());

    const fullDescription = extraDetails.length > 0
      ? `${newPartName.trim()} (${extraDetails.join(' | ')})`
      : newPartName.trim();

    try {
      setIsAddingPart(true);
      await addLineMutation.mutateAsync({
        ticketId: ticket.id,
        data: {
          type: 'PART',
          description: fullDescription,
          unitPrice: priceNum,
          unitCost: cost > 0 ? cost : undefined,
          inventoryItemId: newPartInventoryItemId || undefined,
          quantity: qtyNum,
          discountAmount: finalDiscAmt,
          taxMode: newPartTaxMode,
          taxRate: newPartTaxMode !== 'NONE' ? taxRate : 0,
          warrantyEnabled: warrantyEnabled,
          warrantyDuration: warrantyEnabled ? durNum : undefined,
          warrantyUnit: warrantyEnabled ? unitVal : undefined,
          warrantyCoverage: warrantyEnabled ? 'Full parts and labor warranty' : undefined,
        } as any
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
      setNewPartBrand('');
      setNewPartSupplier('');
      setNewPartHsnCode('');
      setNewPartPrice('');
      setNewPartQty('1');
      setNewPartCost('');
      setNewPartInventoryItemId(null);
      setDiscountVal('');
      setDiscountType('AMOUNT');
      setNewPartDiscAmt('');
      setNewPartDiscPct('');
      setNewPartTaxMode('NONE');
      setNewPartTaxRate('18');
      setHasWarrantyToggle(false);
      setSimpleWarrantyDuration(90);
      setSimpleWarrantyUnit('Days');
      setWarrantiesList([]);
      setAddPartMode('CATALOG');
      setRecordPartPayment(false);
      setIsPartSplitPayment(false);
      setPartPaymentMethod('CASH');
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

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      await deletePaymentMutation.mutateAsync({ ticketId: ticket.id, paymentId: paymentToDelete.id });
      showToast('Payment record deleted', 'success');
      setPaymentToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete payment', 'warning');
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

  // Separate comments from actual file attachments
  const comments = (ticket.attachments || []).filter(a => a.type === 'comment');
  const mediaAttachments = (ticket.attachments || []).filter(
    (a: any) =>
      a.type === 'photo' ||
      a.type === 'image' ||
      a.type === 'video' ||
      a.category === 'TICKET_INTAKE_PHOTO' ||
      (a.mimeType && (a.mimeType.startsWith('image/') || a.mimeType.startsWith('video/'))) ||
      (a.url && a.type !== 'comment')
  );

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
    <div className="-m-4 sm:-m-6 lg:-m-8 min-h-screen bg-[#ECEFF3] text-[#1e293b] flex flex-col">
      {/* Sticky Top Header */}
      <TicketDetailsHeader
        ticket={ticket}
        onBack={onBack}
        onEdit={onEdit}
        isLinkCopied={isLinkCopied}
        onCopyTrackingLink={handleCopyTrackingLink}
        isTechnician={isTechnician}
        completeRepairMutationPending={completeRepairMutation.isPending}
        onCompleteRepair={async () => {
          try {
            await completeRepairMutation.mutateAsync(ticket.id);
            showToast('Repair marked as completed. Sent for invoice processing.', 'success');
          } catch (err: any) {
            showToast(err.message || 'Failed to complete repair', 'warning');
          }
        }}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto px-5 py-6 sm:px-8">

        {/* Main Full-Width Content Container */}
        <div className="w-full space-y-6">

          {/* Tabbed Details Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs">
            <div
              ref={tabListRef}
              className="relative px-5 bg-[#f8fafc] flex flex-wrap gap-x-2 border-b border-[#e2e8f0]"
            >
              <div
                className="absolute bottom-0 h-0.5 bg-[#116dff] rounded-full transition-[left,width] duration-300 ease-out pointer-events-none z-10"
                style={{ left: tabIndicator.left, width: tabIndicator.width }}
                aria-hidden
              />
              {(
                [
                  { id: 'description' as const, label: 'DESCRIPTION & ISSUE', icon: FileText },
                  { id: 'parts' as const, label: 'PARTS REQUIRED', icon: PackageSearch, count: (ticket.partsRequired || []).length },
                  { id: 'payments' as const, label: 'PAYMENTS', icon: IndianRupee, count: payments.length },
                  { id: 'files' as const, label: 'FILES', icon: ImageIcon, count: mediaAttachments.length },
                  { id: 'activity' as const, label: 'ACTIVITY & COMMENTS', icon: MessageSquare, count: comments.length },
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
                    className={`relative inline-flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${isActive
                      ? 'text-[#116dff]'
                      : 'text-[#64748b] hover:text-[#1e293b]'
                      }`}
                  >
                    {label}
                    {count != null && count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#eff6ff] text-[#116dff]' : 'bg-[#e2e8f0] text-[#64748b]'
                        }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {activeTab === 'description' && (
                <TicketDescriptionTab
                  ticket={ticket}
                  createdDate={createdDate}
                  mediaAttachments={mediaAttachments}
                />
              )}

              {activeTab === 'parts' && (
                <TicketPartsTab
                  partsLineItems={partsLineItems}
                  totalPartsCost={totalPartsCost}
                  isCompleted={isCompleted}
                  onOpenAddPartModal={() => setIsPartsModalOpen(true)}
                  onDeletePart={handleDeletePart}
                />
              )}

              {activeTab === 'payments' && (
                <TicketPaymentsTab
                  payments={payments}
                  isCompleted={isCompleted}
                  onOpenRecordPaymentModal={() => setIsPaymentModalOpen(true)}
                  onDeletePayment={(p) => setPaymentToDelete(p)}
                />
              )}

              {activeTab === 'files' && (
                <TicketAttachmentsTab mediaAttachments={mediaAttachments} />
              )}

              {activeTab === 'activity' && (
                <TicketActivityTab
                  comments={comments}
                  onOpenAddCommentModal={() => setIsActivityModalOpen(true)}
                />
              )}
            </div>
            {/* Add Part Drawer */}
            <Drawer
              isOpen={isPartsModalOpen}
              onClose={() => setIsPartsModalOpen(false)}
              title={
                <span className="flex items-center gap-2 font-bold text-base text-[#1e293b]">
                  Add Part / Hardware Item
                </span>
              }
              maxWidth="full"
              footer={
                <>
                  <button
                    type="button"
                    onClick={() => setIsPartsModalOpen(false)}
                    className="h-10 px-5 rounded-xl text-xs font-bold text-[#64748b] hover:text-[#1e293b] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    disabled={isAddingPart || !newPartName.trim()}
                    className="h-10 px-6 rounded-xl text-xs font-bold bg-[#116dff] hover:bg-[#2563eb] text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    {isAddingPart && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Part
                  </button>
                </>
              }
            >
              {/* Full-page content: max content width, centered */}
              <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">

                {/* Mode Selector */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center p-1 rounded-full border border-[#e2e8f0] bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setAddPartMode('CATALOG')}
                      className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${addPartMode === 'CATALOG'
                        ? 'bg-[#eff6ff] text-[#116dff]'
                        : 'text-[#64748b] hover:text-[#1e293b]'
                        }`}
                    >
                      <span>Select from Products</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddPartMode('MANUAL');
                        setNewPartInventoryItemId(null);
                      }}
                      className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${addPartMode === 'MANUAL'
                        ? 'bg-[#eff6ff] text-[#116dff]'
                        : 'text-[#64748b] hover:text-[#1e293b]'
                        }`}
                    >
                      <span>Add Manually</span>
                    </button>
                  </div>
                </div>

                {/* MODE: CATALOG (Select from saved products) */}
                {addPartMode === 'CATALOG' ? (
                  <div className="max-w-4xl mx-auto space-y-6">

                    {/* PRODUCT SEARCH & CATEGORY FILTER */}
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-3">
                      <label className="block text-xs font-bold text-[#1e293b] uppercase tracking-wider">
                        Search Saved Products / Items <span className="text-rose-500">*</span>
                      </label>
                      <PartSearchCombo
                        value={newPartName}
                        onChange={setNewPartName}
                        onSelectInventoryItem={(item) => {
                          setNewPartName(item.name);
                          setNewPartPrice(item.sellingPrice);
                          setNewPartCost(item.costPrice || '');
                          setNewPartBrand(item.brand || '');
                          setNewPartInventoryItemId(item.id);

                          // Auto fill single payment amount with item price
                          const priceVal = String(item.sellingPrice || '');
                          setPartSingleAmount(priceVal);

                          const descText = (item as any).description || [item.brand, item.category].filter(Boolean).join(' ');
                          if (descText) {
                            setNewPartDesc(descText);
                          }
                          if (item.warrantyDuration && item.warrantyUnit) {
                            const unitVal = (item.warrantyUnit === 'MONTHS' ? 'Months' : item.warrantyUnit === 'YEARS' ? 'Years' : 'Days');
                            const expDate = computeWarrantyExpiry(item.warrantyDuration, unitVal);
                            setWarrantiesList([
                              {
                                id: `w_${Date.now()}`,
                                type: item.warrantyType || 'Shop Warranty',
                                provider: 'ZevioDesk Shop',
                                duration: item.warrantyDuration,
                                unit: unitVal as any,
                                expiryDate: expDate,
                                notes: 'Catalog product warranty',
                              }
                            ]);
                          }
                          if (item.gstRate) {
                            const rateNum = parseFloat(item.gstRate.replace('%', ''));
                            if (!isNaN(rateNum) && rateNum >= 0) {
                              setNewPartTaxMode((item.taxType as string) === 'EXCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE');
                              setNewPartTaxRate(rateNum.toString());
                            }
                          }
                        }}
                        onSelectManual={() => {
                          setAddPartMode('MANUAL');
                          setNewPartInventoryItemId(null);
                          setNewPartCost('');
                        }}
                        inventoryEnabled={true}
                        placeholder="Search product by name, brand, SKU or category..."
                        className="w-full h-[46px] px-4 rounded-xl bg-slate-50 border border-[#e2e8f0] text-sm font-semibold text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                      />
                    </div>

                    {/* SELECTED PRODUCT SUMMARY CARD & QUANTITY */}
                    {(newPartName.trim() && newPartInventoryItemId) ? (
                      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-[#1e293b]">{newPartName}</h4>
                              {newPartBrand && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#116dff]">
                                  {newPartBrand}
                                </span>
                              )}
                            </div>
                            {newPartDesc && (
                              <p className="text-xs text-slate-500 mt-1">{newPartDesc}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-500 block font-medium">Selling Price</span>
                            <span className="text-lg font-mono font-bold text-[#116dff]">
                              ₹{parseFloat(newPartPrice || '0').toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* QUANTITY & CALCULATED TOTAL */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-white p-4 rounded-xl border border-slate-200">
                          <div>
                            <label className="block text-xs font-bold text-[#1e293b] mb-1.5 uppercase tracking-wide">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={newPartQty}
                              onChange={e => {
                                const val = e.target.value;
                                setNewPartQty(val);
                                const total = ((parseFloat(newPartPrice) || 0) * (parseInt(val) || 1)).toFixed(2);
                                setPartSingleAmount(total);
                              }}
                              onWheel={e => e.currentTarget.blur()}
                              className="w-full h-[44px] px-4 rounded-xl bg-slate-50 border border-[#e2e8f0] text-sm font-bold text-[#1e293b] focus:border-[#116dff] outline-none"
                            />
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide block mb-1">
                              Item Subtotal
                            </span>
                            <span className="text-xl font-mono font-extrabold text-slate-900">
                              ₹{((parseFloat(newPartPrice) || 0) * (parseInt(newPartQty) || 1)).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* ADVANCE RECEIVED FOR THIS PART */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                            <span className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Advance Received</span>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <div className="relative flex items-center justify-center shrink-0">
                                <input
                                  type="checkbox"
                                  checked={recordPartPayment}
                                  onChange={e => {
                                    const isChecked = e.target.checked;
                                    setRecordPartPayment(isChecked);
                                    if (isChecked && (!partSingleAmount || parseFloat(partSingleAmount) === 0)) {
                                      const total = ((parseFloat(newPartPrice) || 0) * (parseInt(newPartQty) || 1)).toFixed(2);
                                      if (parseFloat(total) > 0) {
                                        setPartSingleAmount(total);
                                      }
                                    }
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-5 h-5 rounded border border-[#cbd5e1] bg-white peer-checked:bg-[#116dff] peer-checked:border-[#116dff] transition flex items-center justify-center">
                                  {recordPartPayment && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-[#1e293b]">Record payment for this part</span>
                            </label>
                          </div>

                          {recordPartPayment && (
                            <div className="space-y-4">
                              <label className="flex items-center gap-3 cursor-pointer select-none">
                                <div className="relative flex items-center justify-center shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isPartSplitPayment}
                                    onChange={e => setIsPartSplitPayment(e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-5 h-5 rounded border border-[#cbd5e1] bg-white peer-checked:bg-[#116dff] peer-checked:border-[#116dff] transition flex items-center justify-center">
                                    {isPartSplitPayment && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-[#1e293b]">Split Payment (UPI / Card / Cash)</span>
                              </label>

                              {isPartSplitPayment ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">UPI (₹)</label>
                                      <input
                                        type="number" min="0" step="0.01"
                                        value={partUpiAmount}
                                        onChange={e => setPartUpiAmount(e.target.value)}
                                        onWheel={e => e.currentTarget.blur()}
                                        placeholder="0.00"
                                        className="w-full h-[44px] px-3 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Card (₹)</label>
                                      <input
                                        type="number" min="0" step="0.01"
                                        value={partCardAmount}
                                        onChange={e => setPartCardAmount(e.target.value)}
                                        onWheel={e => e.currentTarget.blur()}
                                        placeholder="0.00"
                                        className="w-full h-[44px] px-3 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Cash (₹)</label>
                                      <input
                                        type="number" min="0" step="0.01"
                                        value={partCashAmount}
                                        onChange={e => setPartCashAmount(e.target.value)}
                                        onWheel={e => e.currentTarget.blur()}
                                        placeholder="0.00"
                                        className="w-full h-[44px] px-3 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                                      />
                                    </div>
                                  </div>
                                  <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-3 flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Split Total</span>
                                    <span className="font-mono font-bold text-sm text-[#116dff]">
                                      ₹{((parseFloat(partUpiAmount) || 0) + (parseFloat(partCardAmount) || 0) + (parseFloat(partCashAmount) || 0)).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Amount (₹)</label>
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={partSingleAmount}
                                      onChange={e => setPartSingleAmount(e.target.value)}
                                      onWheel={e => e.currentTarget.blur()}
                                      placeholder="0.00"
                                      className="w-full h-[44px] px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                                    />
                                  </div>
                                  <div className="relative">
                                    <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Method</label>
                                    <select
                                      value={partPaymentMethod}
                                      onChange={e => setPartPaymentMethod(e.target.value)}
                                      className="w-full h-[44px] pl-4 pr-9 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] focus:border-[#116dff] outline-none appearance-none font-semibold"
                                    >
                                      <option value="CASH">Cash</option>
                                      <option value="CARD">Card / POS</option>
                                      <option value="UPI">UPI / Digital</option>
                                      <option value="TRANSFER">Bank Transfer</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-[calc(50%+10px)] -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {!recordPartPayment && (
                            <p className="text-xs text-slate-500 font-medium">Enable to record an advance or part payment for this item.</p>
                          )}
                        </div>

                        {/* OPTIONAL CUSTOMIZATION TOGGLE */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAdvancedCatalogOptions(!showAdvancedCatalogOptions)}
                            className="text-xs font-bold text-[#116dff] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            {showAdvancedCatalogOptions ? '▲ Hide Custom Overrides' : '▼ Customize Price, Discount, GST or Warranty'}
                          </button>
                        </div>

                        {/* EXPANDABLE ADVANCED OPTIONS FOR CATALOG MODE */}
                        {showAdvancedCatalogOptions && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white rounded-xl border border-slate-200 animate-in fade-in duration-150">
                            <div>
                              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Override Unit Price (₹)</label>
                              <input
                                type="number" min="0" step="0.01"
                                value={newPartPrice}
                                onChange={e => setNewPartPrice(e.target.value)}
                                onWheel={e => e.currentTarget.blur()}
                                className="w-full h-[40px] px-3 rounded-lg bg-slate-50 border border-[#e2e8f0] text-xs font-bold text-[#1e293b] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Discount Amount / %</label>
                              <input
                                type="number" min="0" step="0.01"
                                value={discountVal}
                                onChange={e => setDiscountVal(e.target.value)}
                                onWheel={e => e.currentTarget.blur()}
                                placeholder="0.00"
                                className="w-full h-[40px] px-3 rounded-lg bg-slate-50 border border-[#e2e8f0] text-xs text-[#1e293b] outline-none"
                              />
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-2">
                        <Package className="w-8 h-8 text-slate-400 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-700">Search and Select a Saved Product</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Select any product from your catalog search above. All prices, stock, and saved details will be populated automatically!
                        </p>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* MODE: MANUAL ENTRY (Full form) */}
                    {/* Two-column grid layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                      {/* LEFT COLUMN */}
                      <div className="space-y-5">

                        {/* SECTION 1: PRODUCT INFORMATION */}
                        <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                            <span className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Product Information</span>
                          </div>

                          <div className="space-y-4">
                            {/* Item Name */}
                            <div>
                              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
                                Item Name <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={newPartName}
                                onChange={e => setNewPartName(e.target.value)}
                                placeholder="Enter item name"
                                className="w-full h-[44px] px-4 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none font-semibold"
                              />
                            </div>

                            {/* Brand */}
                            <div>
                              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Brand / Manufacturer</label>
                              <input
                                type="text"
                                value={newPartBrand}
                                onChange={e => setNewPartBrand(e.target.value)}
                                placeholder="Enter brand or manufacturer"
                                className="w-full h-[44px] px-4 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                              />
                            </div>

                            {/* Description */}
                            <div>
                              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Description / Remarks</label>
                              <textarea
                                rows={3}
                                value={newPartDesc}
                                onChange={e => setNewPartDesc(e.target.value)}
                                placeholder="Enter description or remarks..."
                                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e2e8f0] text-xs text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* SECTION 3: WARRANTY */}
                        <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Warranty</span>
                              {warrantiesList.length > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#116dff]">
                                  {warrantiesList.length} warranty added
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsWarrantyModalOpen(true)}
                              className="h-7 px-3 rounded-lg text-xs font-semibold bg-[#eff6ff] hover:bg-[#dbeafe] text-[#116dff] transition-colors cursor-pointer flex items-center gap-1.5 border border-blue-200/60"
                            >
                              <span>+ Add Warranty</span>
                            </button>
                          </div>

                          {warrantiesList.length === 0 ? (
                            <p className="text-xs text-[#64748b] py-2">No warranty added.</p>
                          ) : (
                            <div className="space-y-2">
                              {warrantiesList.map((w, idx) => (
                                <div key={w.id || idx} className="bg-white border border-[#e2e8f0] rounded-xl p-3.5 flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-[#1e293b]">{w.provider || 'Shop Warranty'}</span>
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#64748b]">
                                        {w.type}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#64748b] mt-0.5">
                                      Duration: <span className="font-semibold text-[#1e293b]">{w.duration} {w.unit}</span>
                                      {w.expiryDate && (
                                        <span className="ml-2 font-mono">
                                          (Expires: {new Date(w.expiryDate).toLocaleDateString()})
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setWarrantiesList(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-rose-500 hover:text-rose-700 text-xs font-semibold p-1"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>{/* END LEFT COLUMN */}

                      {/* RIGHT COLUMN */}
                      <div className="space-y-5">

                        {/* SECTION 2: PRICING & TAX */}
                        <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                            <span className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Pricing &amp; Tax</span>
                          </div>

                          <div className="space-y-4">
                            {/* Qty + Unit Cost */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Quantity *</label>
                                <input
                                  type="number" min="1"
                                  value={newPartQty}
                                  onChange={e => setNewPartQty(e.target.value)}
                                  onWheel={e => e.currentTarget.blur()}
                                  className="w-full h-[44px] px-4 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] focus:border-[#116dff] outline-none font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Unit Cost (₹)</label>
                                <input
                                  type="number" min="0" step="0.01"
                                  value={newPartCost}
                                  onChange={e => setNewPartCost(e.target.value)}
                                  onWheel={e => e.currentTarget.blur()}
                                  placeholder="0.00"
                                  className="w-full h-[44px] px-4 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                                />
                              </div>
                            </div>

                            {/* Unit Price — label updates based on GST mode */}
                            <div>
                              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
                                Unit Price (₹) *
                                {newPartTaxMode === 'EXCLUSIVE' && newPartTaxRate !== '0' && (
                                  <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">excl. GST</span>
                                )}
                                {newPartTaxMode === 'INCLUSIVE' && newPartTaxRate !== '0' && (
                                  <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">incl. GST</span>
                                )}
                              </label>
                              <input
                                type="number" min="0" step="0.01"
                                value={newPartPrice}
                                onChange={e => setNewPartPrice(e.target.value)}
                                onWheel={e => e.currentTarget.blur()}
                                placeholder="0.00"
                                className="w-full h-[44px] px-4 rounded-xl bg-white border border-[#e2e8f0] text-sm font-bold text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                              />
                            </div>

                            {/* Discount */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-[#1e293b]">Discount</label>
                                <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded-lg text-[10px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => setDiscountType('AMOUNT')}
                                    className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${discountType === 'AMOUNT' ? 'bg-white text-[#116dff] shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                                  >
                                    Amount
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDiscountType('PERCENT')}
                                    className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${discountType === 'PERCENT' ? 'bg-white text-[#116dff] shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                                  >
                                    %
                                  </button>
                                </div>
                              </div>
                              <input
                                type="number" min="0" step="0.01"
                                value={discountVal}
                                onChange={e => setDiscountVal(e.target.value)}
                                onWheel={e => e.currentTarget.blur()}
                                placeholder={discountType === 'AMOUNT' ? '0.00' : '0'}
                                className="w-full h-[44px] px-4 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                              />
                              {(() => {
                                const qtyNum = parseFloat(newPartQty) || 1;
                                const priceNum = parseFloat(newPartPrice) || 0;
                                const baseTotal = qtyNum * priceNum;
                                const valNum = parseFloat(discountVal) || 0;
                                if (baseTotal <= 0 || valNum <= 0) return null;
                                if (discountType === 'AMOUNT') {
                                  const pct = ((valNum / baseTotal) * 100).toFixed(2);
                                  return <p className="text-[11px] font-semibold text-[#116dff] mt-1.5 font-mono">Calculated: {pct}%</p>;
                                } else {
                                  const amt = ((valNum / 100) * baseTotal).toFixed(2);
                                  return <p className="text-[11px] font-semibold text-[#116dff] mt-1.5 font-mono">Calculated: ₹{amt}</p>;
                                }
                              })()}
                            </div>

                            {/* GST Rate + Price Type in a row */}
                            <div className="grid grid-cols-2 gap-4 items-start">
                              <div>
                                <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">GST Rate</label>
                                <div className="relative">
                                  <select
                                    value={newPartTaxRate}
                                    onChange={e => {
                                      setNewPartTaxRate(e.target.value);
                                      if (e.target.value !== '0') {
                                        setNewPartTaxMode(prev => prev === 'INCLUSIVE' ? 'INCLUSIVE' : 'EXCLUSIVE');
                                      } else {
                                        setNewPartTaxMode('NONE');
                                      }
                                    }}
                                    className="w-full h-[44px] pl-4 pr-8 rounded-xl bg-white border border-[#e2e8f0] text-xs text-[#1e293b] focus:border-[#116dff] outline-none appearance-none cursor-pointer font-semibold"
                                  >
                                    <option value="0">0% GST</option>
                                    <option value="5">5% GST</option>
                                    <option value="12">12% GST</option>
                                    <option value="18">18% GST (Standard)</option>
                                    <option value="28">28% GST</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                                </div>
                              </div>
                              {newPartTaxRate !== '0' ? (
                                <div className="flex flex-col gap-1">
                                  <label className="block text-xs font-semibold text-[#1e293b] mb-1">Price Type</label>
                                  <div className="flex w-full items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-bold">
                                    <button
                                      type="button"
                                      onClick={() => setNewPartTaxMode('EXCLUSIVE')}
                                      className={`flex-1 py-2 rounded-md transition-all cursor-pointer text-center ${newPartTaxMode === 'EXCLUSIVE'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                      excl. GST
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setNewPartTaxMode('INCLUSIVE')}
                                      className={`flex-1 py-2 rounded-md transition-all cursor-pointer text-center ${newPartTaxMode === 'INCLUSIVE'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                      incl. GST
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    {newPartTaxMode === 'INCLUSIVE'
                                      ? 'Price already includes GST — tax extracted from total'
                                      : newPartTaxMode === 'EXCLUSIVE'
                                        ? 'GST added on top of the entered price'
                                        : 'Select excl. or incl. to apply GST'}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Price Type</label>
                                  <p className="text-[10px] text-slate-400">Select a GST rate to enable</p>
                                </div>
                              )}
                            </div>

                            {/* HSN / SAC */}
                            <div>
                              <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">HSN / SAC (Optional)</label>
                              <input
                                type="text"
                                value={newPartHsnCode}
                                onChange={e => setNewPartHsnCode(e.target.value)}
                                placeholder="Enter HSN/SAC code"
                                className="w-full h-[44px] px-4 rounded-xl bg-white border border-[#e2e8f0] text-xs text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                              />
                            </div>
                          </div>
                        </div>

                      </div>{/* END RIGHT COLUMN */}
                    </div>{/* END MAIN 2-COLUMN GRID */}

                    {/* BOTTOM ROW: Supplier (left) + Advance Received (right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                      {/* SECTION 4: SUPPLIER */}
                      <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                          <span className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Supplier</span>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Supplier / Vendor</label>
                          <input
                            type="text"
                            value={newPartSupplier}
                            onChange={e => setNewPartSupplier(e.target.value)}
                            placeholder="Enter supplier or vendor name"
                            className="w-full h-[44px] px-4 rounded-xl bg-white border border-[#e2e8f0] text-xs text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                          />
                        </div>
                      </div>

                      {/* SECTION 5: ADVANCE RECEIVED */}
                      <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                          <span className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Advance Received</span>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div className="relative flex items-center justify-center shrink-0">
                              <input
                                type="checkbox"
                                checked={recordPartPayment}
                                onChange={e => {
                                  const isChecked = e.target.checked;
                                  setRecordPartPayment(isChecked);
                                  if (isChecked && (!partSingleAmount || parseFloat(partSingleAmount) === 0)) {
                                    const total = ((parseFloat(newPartPrice) || 0) * (parseInt(newPartQty) || 1)).toFixed(2);
                                    if (parseFloat(total) > 0) {
                                      setPartSingleAmount(total);
                                    }
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-5 h-5 rounded border border-[#cbd5e1] bg-white peer-checked:bg-[#116dff] peer-checked:border-[#116dff] transition flex items-center justify-center">
                                {recordPartPayment && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-[#1e293b]">Record payment for this part</span>
                          </label>
                        </div>

                        {recordPartPayment && (
                          <div className="space-y-4">
                            {/* Split Payment Toggle */}
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                              <div className="relative flex items-center justify-center shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isPartSplitPayment}
                                  onChange={e => setIsPartSplitPayment(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-5 h-5 rounded border border-[#cbd5e1] bg-white peer-checked:bg-[#116dff] peer-checked:border-[#116dff] transition flex items-center justify-center">
                                  {isPartSplitPayment && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-[#1e293b]">Split Payment (UPI / Card / Cash)</span>
                            </label>

                            {isPartSplitPayment ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">UPI (₹)</label>
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={partUpiAmount}
                                      onChange={e => setPartUpiAmount(e.target.value)}
                                      placeholder="0.00"
                                      className="w-full h-[44px] px-3 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Card (₹)</label>
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={partCardAmount}
                                      onChange={e => setPartCardAmount(e.target.value)}
                                      placeholder="0.00"
                                      className="w-full h-[44px] px-3 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Cash (₹)</label>
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={partCashAmount}
                                      onChange={e => setPartCashAmount(e.target.value)}
                                      placeholder="0.00"
                                      className="w-full h-[44px] px-3 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-3 flex justify-between items-center">
                                  <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Split Total</span>
                                  <span className="font-mono font-bold text-sm text-[#116dff]">
                                    ₹{((parseFloat(partUpiAmount) || 0) + (parseFloat(partCardAmount) || 0) + (parseFloat(partCashAmount) || 0)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Amount (₹)</label>
                                  <input
                                    type="number" min="0" step="0.01"
                                    value={partSingleAmount}
                                    onChange={e => setPartSingleAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full h-[44px] px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                                  />
                                </div>
                                <div className="relative">
                                  <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Method</label>
                                  <select
                                    value={partPaymentMethod}
                                    onChange={e => setPartPaymentMethod(e.target.value)}
                                    className="w-full h-[44px] pl-4 pr-9 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] focus:border-[#116dff] outline-none appearance-none font-semibold"
                                  >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card / POS</option>
                                    <option value="UPI">UPI / Digital</option>
                                    <option value="TRANSFER">Bank Transfer</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-3 top-[calc(50%+10px)] -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {!recordPartPayment && (
                          <p className="text-xs text-slate-500 font-medium py-1">Enable to record an advance or part payment for this item.</p>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>{/* END max-w-6xl WRAPPER */}
            </Drawer>

            {/* New Warranty Modal Popup */}
            <WarrantyModal
              isOpen={isWarrantyModalOpen}
              onClose={() => setIsWarrantyModalOpen(false)}
              onSave={(newWarranty) => {
                setWarrantiesList(prev => [...prev, newWarranty]);
              }}
            />

            {/* Payment Modal */}
            {isPaymentModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="w-full max-w-lg bg-white border border-[#e2e8f0] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between shrink-0 bg-[#f8fafc]">
                    <h3 className="text-base font-bold text-[#1e293b] flex items-center gap-2">
                      Record Payment
                    </h3>
                    <button
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="text-[#64748b] hover:text-[#1e293b] cursor-pointer p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    {/* Type */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Payment Type</label>
                      <select
                        value={paymentType}
                        onChange={e => setPaymentType(e.target.value as PaymentType)}
                        className="w-full h-[46px] pl-4 pr-10 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] focus:border-[#116dff] outline-none appearance-none font-semibold"
                      >
                        <option value="ADVANCE">Advance</option>
                        <option value="PARTS">Parts</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="FINAL">Final Balance</option>
                        <option value="REFUND">Refund</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-[calc(50%+10px)] -translate-y-1/2 w-4 h-4 text-[#64748b]" />
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
                        <div className="w-5 h-5 rounded border border-[#cbd5e1] bg-white peer-checked:bg-[#116dff] peer-checked:border-[#116dff] transition flex items-center justify-center">
                          {isSplitPayment && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-[#1e293b]">Split Payment (UPI / Card / Cash)</span>
                    </label>

                    {isSplitPayment ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">UPI / QR (₹)</label>
                            <input
                              type="number" min="0" step="0.01"
                              value={upiAmount}
                              onChange={e => setUpiAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full h-[46px] px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Card (₹)</label>
                            <input
                              type="number" min="0" step="0.01"
                              value={cardAmount}
                              onChange={e => setCardAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full h-[46px] px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Cash (₹)</label>
                            <input
                              type="number" min="0" step="0.01"
                              value={cashAmount}
                              onChange={e => setCashAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full h-[46px] px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                            />
                          </div>
                        </div>
                        {/* Split Total */}
                        <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-3 flex justify-between items-center">
                          <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Split Total</span>
                          <span className="font-mono font-bold text-sm text-[#116dff]">
                            ₹{((parseFloat(upiAmount) || 0) + (parseFloat(cardAmount) || 0) + (parseFloat(cashAmount) || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Amount (₹)</label>
                          <input
                            type="number" min="0" step="0.01"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full h-[46px] px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                          />
                        </div>
                        <div className="relative">
                          <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Method</label>
                          <select
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            className="w-full h-[46px] pl-4 pr-10 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] focus:border-[#116dff] outline-none appearance-none font-semibold"
                          >
                            <option value="CASH">Cash</option>
                            <option value="CARD">Card / POS</option>
                            <option value="UPI">UPI / Digital</option>
                            <option value="TRANSFER">Bank Transfer</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-[calc(50%+10px)] -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Notes (Optional)</label>
                      <input
                        value={paymentNotes}
                        onChange={e => setPaymentNotes(e.target.value)}
                        placeholder="e.g. advance for LCD replacement"
                        className="w-full h-[46px] px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none"
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#e2e8f0] flex justify-end gap-3 shrink-0 bg-[#f8fafc]">
                    <button
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="h-10 px-5 rounded-xl text-xs font-bold text-[#64748b] hover:text-[#1e293b] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRecordPayment}
                      disabled={isRecordingPayment}
                      className="h-10 px-6 rounded-xl text-xs font-bold bg-[#116dff] hover:bg-[#2563eb] text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-xs"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="w-full max-w-md bg-white border border-[#e2e8f0] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
                    <h3 className="text-base font-bold text-[#1e293b] flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#116dff]" /> Add Comment
                    </h3>
                    <button
                      onClick={() => setIsActivityModalOpen(false)}
                      className="text-[#64748b] hover:text-[#1e293b] cursor-pointer p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <label className="block text-xs font-semibold text-[#1e293b] mb-1.5 uppercase tracking-wide">Comment <span className="text-rose-500">*</span></label>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a comment or status update..."
                      className="w-full min-h-[120px] p-3.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#116dff] outline-none resize-y"
                    />
                  </div>
                  <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-3">
                    <button
                      onClick={() => setIsActivityModalOpen(false)}
                      className="h-10 px-5 rounded-xl text-xs font-bold text-[#64748b] hover:text-[#1e293b] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddComment}
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="h-10 px-6 rounded-xl text-xs font-bold bg-[#116dff] hover:bg-[#2563eb] text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-xs"
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
              message={
                partToDeleteObj
                  ? associatedPartPaymentAmount > 0
                    ? `Are you sure you want to remove "${partToDeleteObj.description}"? ⚠️ Note: An advance payment intake of ₹${associatedPartPaymentAmount.toFixed(2)} recorded for this part will ALSO be permanently deleted. This action cannot be undone.`
                    : `Are you sure you want to remove "${partToDeleteObj.description}"? This action cannot be undone.`
                  : 'Are you sure you want to remove this part? This action cannot be undone.'
              }
              confirmText="Remove"
              cancelText="Cancel"
              type="danger"
              onConfirm={confirmDeletePart}
              onCancel={() => setPartToDelete(null)}
              isLoading={removeLineMutation.isPending}
            />

            <ConfirmationModal
              isOpen={!!paymentToDelete}
              title="Delete Payment Record"
              message={`Are you sure you want to delete this payment record of ₹${Number(paymentToDelete?.amount || 0).toFixed(2)} (${paymentToDelete?.method || 'Payment'})? This action cannot be undone.`}
              confirmText="Delete"
              cancelText="Cancel"
              type="danger"
              onConfirm={confirmDeletePayment}
              onCancel={() => setPaymentToDelete(null)}
              isLoading={deletePaymentMutation.isPending}
            />

            {/* Mark Ready for Pickup Modal */}
            {isReadyForPickupModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 space-y-0">
                  <div className="bg-[#116dff] px-6 py-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-5 h-5" />
                      <h3 className="text-base font-bold">Mark Ready for Pickup</h3>
                    </div>
                    <button
                      onClick={() => setIsReadyForPickupModalOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {isTechnician && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-slate-900">Approval Required (Technician Mode)</span>
                          Technicians can review repair details in Preview Mode. Changing ticket status to Ready for Pickup requires Advisor, Manager, or Admin authorization.
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ticket Number</span>
                          <span className="font-extrabold text-slate-800 text-sm">#{formatTicketReference(ticket)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Device</span>
                          <span className="font-bold text-slate-700">{ticket.brand} {ticket.model || ticket.title}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total Repair Amount</span>
                          <span className="font-mono font-bold text-slate-800">₹{(ticket.totalAmount || ticket.estimatedCost || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Advance Deposit Paid</span>
                          <span className="font-mono font-bold text-emerald-600">₹{((payments || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-slate-900">
                          <span>Balance Due at Pickup</span>
                          <span className="font-mono text-[#116dff]">₹{Math.max(0, (ticket.totalAmount || ticket.estimatedCost || 0) - (payments || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Note for Customer (Visible on Public Tracking Portal)
                      </label>
                      <textarea
                        rows={3}
                        value={customerNoteForPickup}
                        onChange={(e) => setCustomerNoteForPickup(e.target.value)}
                        placeholder="e.g. Device repair complete. Please bring your repair receipt for pickup."
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#116dff] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsReadyForPickupModalOpen(false)}
                      className="px-4 h-10 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isTechnician ? 'Close Preview' : 'Cancel'}
                    </button>
                    {!isTechnician && (
                      <button
                        type="button"
                        onClick={handleConfirmReadyForPickup}
                        disabled={updateTicketMutation.isPending}
                        className="px-5 h-10 rounded-xl bg-[#116dff] hover:bg-[#0d5fd9] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {updateTicketMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Confirm & Mark Ready for Pickup
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Success Modal */}
            <ConfirmationModal
              isOpen={isReadySuccessModalOpen}
              type="info"
              title="✓ Marked Ready for Pickup"
              message={`Ticket #${formatTicketReference(ticket)} status has been updated to Ready for Pickup. Customer live tracking portal is now updated.`}
              confirmText="Done"
              cancelText="View Billing & Invoice"
              onConfirm={() => setIsReadySuccessModalOpen(false)}
              onCancel={() => {
                setIsReadySuccessModalOpen(false);
                navigate(ticketBillingPath(ticket.id));
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
