import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Loader2, Calendar, Search, Tag, CreditCard, Banknote,
  QrCode, Plus, Trash2, Wrench, Package, Percent, BadgePercent,
  ChevronDown, ChevronUp, MessageSquare, Wallet, Printer, Share2,
  FileText, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, User, Lock, Clock, Check
} from 'lucide-react';
import { Ticket } from '../lib/api';
import {
  useInvoiceQuery,
  useAddLineItemMutation,
  useUpdateLineItemMutation,
  useRemoveLineItemMutation,
  useFinalizeInvoiceMutation,
  useVoidInvoiceMutation,
  useCreatePaymentMutation,
  usePaymentsQuery
} from '../hooks/useTicketsQuery';
import { useInvoicingSettingsQuery } from '../hooks/useInvoicesQuery';
import { useAppStore } from '../store/useAppStore';

interface GenerateInvoicePageProps {
  ticket: Ticket;
  onBack: () => void;
  onSuccess: () => void;
}

const fmt = (n: number | string) => {
  const val = typeof n === 'string' ? parseFloat(n) : n;
  return `₹${(val || 0).toFixed(2)}`;
};

function numberToWords(num: number): string {
  const n = Math.round(Math.abs(num));
  if (n === 0) return 'RS ZERO RUPEES ONLY';
  const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
  const b = ['', '', 'TWENTY ', 'THIRTY ', 'FORTY ', 'FIFTY ', 'SIXTY ', 'SEVENTY ', 'EIGHTY ', 'NINETY '];
  function inWords(val: number): string {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + a[val % 10];
    if (val < 1000) return inWords(Math.floor(val / 100)) + 'HUNDRED ' + (val % 100 !== 0 ? 'AND ' + inWords(val % 100) : '');
    if (val < 100000) return inWords(Math.floor(val / 1000)) + 'THOUSAND ' + (val % 1000 !== 0 ? inWords(val % 1000) : '');
    if (val < 10000000) return inWords(Math.floor(val / 100000)) + 'LAKH ' + (val % 100000 !== 0 ? inWords(val % 100000) : '');
    return inWords(Math.floor(val / 10000000)) + 'CRORE ' + (val % 10000000 !== 0 ? inWords(val % 10000000) : '');
  }
  return `RS ${inWords(n).trim()} ONLY`;
}

export const GenerateInvoicePage: React.FC<GenerateInvoicePageProps> = ({ ticket, onBack, onSuccess }) => {
  const { showToast } = useAppStore();

  // ── React Query Hooks ───────────────────────────────────────────────────────
  const { data: invoiceData, isLoading: isLoadingInvoice, refetch: refetchInvoice } = useInvoiceQuery(ticket.id);
  const { data: payments = [], isLoading: isLoadingPayments } = usePaymentsQuery(ticket.id);
  const { data: invoicingSettings } = useInvoicingSettingsQuery();

  const templateLevel = invoicingSettings?.defaultInvoiceDetailLevel || 'STANDARD';

  const addLineMutation = useAddLineItemMutation();
  const updateLineMutation = useUpdateLineItemMutation();
  const removeLineMutation = useRemoveLineItemMutation();
  const finalizeMutation = useFinalizeInvoiceMutation();
  const voidMutation = useVoidInvoiceMutation();
  const createPaymentMutation = useCreatePaymentMutation();

  // ── Local UI Forms ──────────────────────────────────────────────────────────
  const [newItemType, setNewItemType] = useState<'PART' | 'LABOR' | 'SERVICE' | 'PRODUCT' | 'OTHER'>('PART');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDiscountAmt, setNewItemDiscountAmt] = useState('');
  const [newItemDiscountPct, setNewItemDiscountPct] = useState('');
  const [newItemTaxMode, setNewItemTaxMode] = useState<'NONE' | 'EXCLUSIVE' | 'INCLUSIVE'>('NONE');
  const [newItemTaxRate, setNewItemTaxRate] = useState('18');
  const [technicianName, setTechnicianName] = useState(ticket.assignedTo?.name || '');
  const [pricingMode, setPricingMode] = useState<'FIXED' | 'HOURLY'>('FIXED');

  // Warranty snapshot inputs
  const [warrantyEnabled, setWarrantyEnabled] = useState(false);
  const [warrantyDuration, setWarrantyDuration] = useState('6');
  const [warrantyUnit, setWarrantyUnit] = useState<'DAYS' | 'MONTHS' | 'YEARS'>('MONTHS');
  const [warrantyCoverage, setWarrantyCoverage] = useState('Full parts and labor warranty');

  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Finalize / Collect Forms
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [payMethod, setPayMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [isBreakdownPayment, setIsBreakdownPayment] = useState(false);
  const [upiAmount, setUpiAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [showVoidForm, setShowVoidForm] = useState(false);

  // WhatsApp Alert Sync Loading
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // ── Determine Active Status & Totals ───────────────────────────────────────
  const isFinalized = invoiceData && 'status' in invoiceData && invoiceData.status === 'FINALIZED';
  const isVoid = invoiceData && 'status' in invoiceData && invoiceData.status === 'VOID';

  // Extract values depending on draft/finalized state
  const lineItems = useMemo(() => {
    if (!invoiceData) return [];
    if ('lineItems' in invoiceData) return invoiceData.lineItems;
    // For finalized invoice, the line items snapshot might be stored on the record
    if ('lineItemsSnapshot' in invoiceData && Array.isArray(invoiceData.lineItemsSnapshot)) {
      return invoiceData.lineItemsSnapshot;
    }
    return [];
  }, [invoiceData]);

  const totals = useMemo(() => {
    if (!invoiceData) {
      return { subtotal: '0.00', discount: '0.00', taxableAmount: '0.00', tax: '0.00', total: '0.00', amountPaid: '0.00', balanceDue: '0.00' };
    }
    if ('totals' in invoiceData) {
      return invoiceData.totals;
    }
    // If it's a finalized Invoice record
    const inv = invoiceData as any;
    return {
      subtotal: String(inv.subtotal),
      discount: String(inv.discount),
      taxableAmount: String(inv.taxableAmount),
      tax: String(inv.tax),
      total: String(inv.total),
      amountPaid: String(inv.amountPaid),
      balanceDue: String(inv.balanceDue),
    };
  }, [invoiceData]);

  const paymentSummary = useMemo(() => {
    let upiSum = 0;
    let cardSum = 0;
    let cashSum = 0;

    payments.forEach((p: any) => {
      const amt = parseFloat(p.amount || 0);
      const m = (p.method || '').toUpperCase();
      if (m === 'UPI') upiSum += amt;
      else if (m === 'CARD') cardSum += amt;
      else if (m === 'CASH') cashSum += amt;
      else cashSum += amt;
    });

    return { upiSum, cardSum, cashSum, totalPaid: upiSum + cardSum + cashSum };
  }, [payments]);

  // ── Discount & Modal Helpers ────────────────────────────────────────────────
  const handleDiscountAmtChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setNewItemDiscountAmt(val);
      const price = parseFloat(newItemPrice) || 0;
      const qty = parseFloat(newItemQty) || 1;
      const totalBeforeDisc = price * qty;
      if (totalBeforeDisc > 0 && val !== '') {
        const amt = parseFloat(val) || 0;
        const pct = (amt / totalBeforeDisc) * 100;
        setNewItemDiscountPct(pct > 0 ? pct.toFixed(1) : '');
      } else if (val === '') {
        setNewItemDiscountPct('');
      }
    }
  };

  const handleDiscountPctChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setNewItemDiscountPct(val);
      const price = parseFloat(newItemPrice) || 0;
      const qty = parseFloat(newItemQty) || 1;
      const totalBeforeDisc = price * qty;
      if (totalBeforeDisc > 0 && val !== '') {
        const pct = parseFloat(val) || 0;
        const amt = (totalBeforeDisc * pct) / 100;
        setNewItemDiscountAmt(amt > 0 ? amt.toFixed(2) : '');
      } else if (val === '') {
        setNewItemDiscountAmt('');
      }
    }
  };

  const modalLineTotal = useMemo(() => {
    const qty = parseFloat(newItemQty) || 1;
    const price = parseFloat(newItemPrice) || 0;
    const disc = parseFloat(newItemDiscountAmt) || 0;
    const subtotalAfterDisc = Math.max(0, (qty * price) - disc);

    if (newItemTaxMode === 'NONE') return subtotalAfterDisc;
    const rate = parseFloat(newItemTaxRate) || 0;
    if (newItemTaxMode === 'EXCLUSIVE') {
      return subtotalAfterDisc + (subtotalAfterDisc * rate / 100);
    }
    return subtotalAfterDisc;
  }, [newItemQty, newItemPrice, newItemDiscountAmt, newItemTaxMode, newItemTaxRate]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddLineItem = async () => {
    if (!newItemName.trim() || !newItemPrice) {
      showToast('Please enter an item name and price', 'warning');
      return;
    }
    const fullDesc = newItemDesc.trim()
      ? `${newItemName.trim()} — ${newItemDesc.trim()}`
      : newItemName.trim();

    try {
      const isWarrantySupported = newItemType === 'PART' || newItemType === 'PRODUCT' || newItemType === 'OTHER';
      const payload: any = {
        type: newItemType,
        description: fullDesc,
        quantity: Math.max(1, parseFloat(newItemQty) || 1),
        unitPrice: parseFloat(newItemPrice) || 0,
        discountAmount: parseFloat(newItemDiscountAmt) || 0,
        taxMode: newItemTaxMode,
        taxRate: newItemTaxMode !== 'NONE' ? parseFloat(newItemTaxRate) || 0 : 0,
        warrantyEnabled: isWarrantySupported ? warrantyEnabled : false,
      };

      if (warrantyEnabled && isWarrantySupported) {
        payload.warrantyDuration = parseInt(warrantyDuration) || 0;
        payload.warrantyUnit = warrantyUnit;
        payload.warrantyCoverage = warrantyCoverage.trim();
        const start = new Date();
        const end = new Date();
        if (warrantyUnit === 'DAYS') end.setDate(end.getDate() + payload.warrantyDuration);
        else if (warrantyUnit === 'MONTHS') end.setMonth(end.getMonth() + payload.warrantyDuration);
        else if (warrantyUnit === 'YEARS') end.setFullYear(end.getFullYear() + payload.warrantyDuration);
        payload.warrantyStartDate = start.toISOString();
        payload.warrantyEndDate = end.toISOString();
      }

      await addLineMutation.mutateAsync({
        ticketId: ticket.id,
        data: payload,
      });

      showToast('Item added to invoice', 'success');
      setShowAddItemModal(false);
      setNewItemName('');
      setNewItemDesc('');
      setNewItemQty('1');
      setNewItemPrice('');
      setNewItemDiscountAmt('');
      setNewItemDiscountPct('');
      setWarrantyEnabled(false);
      setShowAddItemModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to add line item', 'warning');
    }
  };

  const handleRemoveLineItem = async (lineId: string) => {
    try {
      await removeLineMutation.mutateAsync({ ticketId: ticket.id, lineItemId: lineId });
      showToast('Line item removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove line item', 'warning');
    }
  };

  const handleFinalizeInvoice = async () => {
    if (lineItems.length === 0) {
      showToast('Please add at least one line item before checkout', 'warning');
      return;
    }
    try {
      const data: any = {
        notes: invoiceNotes.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };
      if (customInvoiceNumber.trim()) {
        data.invoiceNumber = customInvoiceNumber.trim();
      }
      await finalizeMutation.mutateAsync({ ticketId: ticket.id, data });

      // Automatically record payment if balance due > 0
      const balNum = parseFloat(totals.balanceDue);
      if (balNum > 0) {
        if (isBreakdownPayment) {
          const upiVal = parseFloat(upiAmount) || 0;
          const cardVal = parseFloat(cardAmount) || 0;
          const cashVal = parseFloat(cashAmount) || 0;
          if (upiVal > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: { amount: upiVal, type: 'FINAL', method: 'UPI', notes: 'Breakdown payment - UPI/QR' }
            });
          }
          if (cardVal > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: { amount: cardVal, type: 'FINAL', method: 'CARD', notes: 'Breakdown payment - Card' }
            });
          }
          if (cashVal > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: { amount: cashVal, type: 'FINAL', method: 'CASH', notes: 'Breakdown payment - Cash' }
            });
          }
        } else {
          await createPaymentMutation.mutateAsync({
            ticketId: ticket.id,
            data: { amount: balNum, type: 'FINAL', method: payMethod, notes: 'Checkout payment' }
          });
        }
      }

      showToast('Checkout completed successfully!', 'success');
      refetchInvoice();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete checkout', 'warning');
    }
  };

  const handleCollectPayment = async () => {
    const balNum = parseFloat(totals.balanceDue);
    if (balNum <= 0) return;

    if (isBreakdownPayment) {
      const upiVal = parseFloat(upiAmount) || 0;
      const cardVal = parseFloat(cardAmount) || 0;
      const cashVal = parseFloat(cashAmount) || 0;
      const totalSplit = upiVal + cardVal + cashVal;

      if (totalSplit <= 0) {
        showToast('Please enter an amount for at least one breakdown payment method (UPI/QR, Card, Cash)', 'warning');
        return;
      }

      try {
        if (upiVal > 0) {
          await createPaymentMutation.mutateAsync({
            ticketId: ticket.id,
            data: { amount: upiVal, type: 'FINAL', method: 'UPI', notes: 'Breakdown payment - UPI/QR' }
          });
        }
        if (cardVal > 0) {
          await createPaymentMutation.mutateAsync({
            ticketId: ticket.id,
            data: { amount: cardVal, type: 'FINAL', method: 'CARD', notes: 'Breakdown payment - Card' }
          });
        }
        if (cashVal > 0) {
          await createPaymentMutation.mutateAsync({
            ticketId: ticket.id,
            data: { amount: cashVal, type: 'FINAL', method: 'CASH', notes: 'Breakdown payment - Cash' }
          });
        }
        showToast('Breakdown payments recorded successfully!', 'success');
        setUpiAmount('');
        setCardAmount('');
        setCashAmount('');
        refetchInvoice();
      } catch (err: any) {
        showToast(err.message || 'Failed to record payment', 'warning');
      }
    } else {
      try {
        await createPaymentMutation.mutateAsync({
          ticketId: ticket.id,
          data: {
            amount: balNum,
            type: 'FINAL',
            method: payMethod,
            notes: 'Final checkout payment',
          }
        });
        showToast('Payment recorded successfully!', 'success');
        refetchInvoice();
      } catch (err: any) {
        showToast(err.message || 'Failed to record payment', 'warning');
      }
    }
  };

  const handleVoidInvoice = async () => {
    if (!voidReason.trim()) {
      showToast('Please provide a reason for voiding', 'warning');
      return;
    }
    try {
      await voidMutation.mutateAsync({ ticketId: ticket.id, data: { reason: voidReason.trim() } });
      showToast('Invoice voided successfully', 'info');
      setShowVoidForm(false);
      refetchInvoice();
    } catch (err: any) {
      showToast(err.message || 'Failed to void invoice', 'warning');
    }
  };

  const handleWhatsAppSend = async () => {
    setIsSendingWhatsApp(true);
    try {
      // Trigger WhatsApp API endpoint
      const response = await fetch(`http://localhost:3001/api/whatsapp/send-invoice-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zevio_token') || ''}`,
        },
        body: JSON.stringify({ ticketId: ticket.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to dispatch notification');
      showToast('Invoice notification dispatched via WhatsApp!', 'success');
    } catch (err: any) {
      showToast(err.message || 'WhatsApp integration not configured or server offline', 'warning');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ── Render Helpers ──────────────────────────────────────────────────────────
  const getIcon = (type: string) => {
    if (type === 'PART') return <Package className="w-4 h-4 text-[#3B82F6]" />;
    if (type === 'LABOR') return <Wrench className="w-4 h-4 text-[#F59E0B]" />;
    return <BadgePercent className="w-4 h-4 text-emerald-400" />;
  };

  if (isLoadingInvoice || isLoadingPayments) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#d99b26]" />
          <p className="text-sm text-[#8b949e]">Loading Invoice details...</p>
        </div>
      </div>
    );
  }

  // ── FINALIZED / COMPLETED CHECKOUT BILL PREVIEW PAGE ───────────────────────
  if (isFinalized) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col font-sans">
        {/* Sticky Top Header Bar */}
        <div className="h-16 px-6 bg-[#0d121c] border-b border-[#1f293d] flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-[#182030] border border-[#1f293d] text-[#9CA3AF] hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                Tax Invoice Preview
              </h1>
              <p className="text-xs text-[#9CA3AF]">
                Job #{ticket.jobNumber || ticket.id.slice(0, 8)} · {ticket.customer?.name || 'Walk-in'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleWhatsAppSend}
              disabled={isSendingWhatsApp}
              className="px-4 py-2 bg-[#182030] border border-[#1f293d] text-white text-xs font-semibold rounded-xl hover:bg-[#202c42] transition cursor-pointer flex items-center gap-2"
            >
              {isSendingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send WhatsApp</>}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#182030] border border-[#1f293d] text-white text-xs font-semibold rounded-xl hover:bg-[#202c42] transition cursor-pointer"
            >
              Download / Print
            </button>
            <button
              type="button"
              onClick={onSuccess}
              className="px-4 py-2 bg-[#D99B26] hover:bg-[#e5a93c] text-[#0d121c] text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        </div>        {/* Printable Bill Preview Container (Realistic PDF Paper Document View) */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
          {/* Authentic White Paper PDF Document Sheet */}
          <div className="invoice-print bg-white text-gray-900 border border-gray-200 rounded-xl p-8 sm:p-10 space-y-6 shadow-2xl font-sans print:shadow-none print:border-none print:p-0">
            
            {/* Top Header: Shop Name & Details, Logo on Left */}
            <div className="flex items-start justify-between border-b border-gray-300 pb-4">
              <div className="flex items-center gap-4">
                {invoicingSettings?.logoUrl && (
                  <img src={invoicingSettings.logoUrl} alt="Shop Logo" className="max-h-14 max-w-[140px] object-contain" />
                )}
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight uppercase">
                    {invoicingSettings?.name || 'Zevio Tech Repair Services'}
                  </h2>
                  {invoicingSettings?.address && (
                    <p className="text-xs text-gray-600 mt-0.5 leading-tight">{invoicingSettings.address}</p>
                  )}
                  {invoicingSettings?.phone && (
                    <p className="text-xs font-mono text-gray-600 mt-0.5">Phone: {invoicingSettings.phone}</p>
                  )}
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-sm font-mono font-extrabold text-amber-700 block">
                  #{invoiceData?.invoiceNumber || `INV-${ticket.id.slice(0, 8).toUpperCase()}`}
                </span>
                <span className={`inline-block px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  parseFloat(totals.balanceDue) <= 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-amber-50 text-amber-700 border border-amber-300'
                }`}>
                  {parseFloat(totals.balanceDue) <= 0 ? 'FULLY PAID' : 'PARTIALLY PAID'}
                </span>
              </div>
            </div>

            {/* GSTIN Sub-header Banner */}
            {invoicingSettings?.gstNumber && (
              <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700">GSTIN : <span className="font-mono text-gray-900 font-extrabold">{invoicingSettings.gstNumber}</span></span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Official Tax Invoice</span>
              </div>
            )}

            {/* Structured 2-Column Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
              {/* Left Column Metadata */}
              <div className="space-y-1.5 font-mono">
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Document No.</span><span className="text-gray-900 font-bold">: {invoiceData?.invoiceNumber || `INV-${ticket.id.slice(0, 8).toUpperCase()}`}</span></div>
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Invoice Date</span><span className="text-gray-800">: {new Date(invoiceData?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div>
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Billed To</span><span className="text-gray-900 font-bold">: {ticket.customer?.name || 'Walk-in Customer'}</span></div>
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Mobile No.</span><span className="text-gray-800">: {ticket.customer?.phone || '—'}</span></div>
                {(ticket.customer as any)?.address && (
                  <div className="flex"><span className="w-32 text-gray-500 font-semibold">Delivery Address</span><span className="text-gray-800">: {(ticket.customer as any).address}</span></div>
                )}
                {ticket.assignedTo?.name && (
                  <div className="flex"><span className="w-32 text-gray-500 font-semibold">Technician</span><span className="text-gray-800">: {ticket.assignedTo.name}</span></div>
                )}
              </div>

              {/* Right Column Metadata */}
              <div className="space-y-1.5 font-mono">
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Jobcard Name</span><span className="text-gray-900 font-bold">: #{ticket.jobNumber || ticket.id.slice(0, 8)}</span></div>
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Jobcard Date</span><span className="text-gray-800">: {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div>
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Invoice Type</span><span className="text-amber-800 font-bold">: {paymentSummary.totalPaid > 0 ? (paymentSummary.upiSum > 0 && paymentSummary.cashSum > 0 ? 'Split Payment' : 'Paid') : 'Due'}</span></div>
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Repair Type</span><span className="text-gray-800">: {ticket.itemCategory || 'Paid Repair Service'}</span></div>
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Registration / Serial</span><span className="text-gray-800">: {ticket.serialNumber || '—'}</span></div>
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Model Name</span><span className="text-gray-900 font-bold">: {[ticket.brand, ticket.model].filter(Boolean).join(' ') || 'Standard Model'}</span></div>
              </div>
            </div>

            {/* PART INVOICE TABLE */}
            {lineItems.filter((i: any) => i.type === 'PART' || i.type === 'PRODUCT').length > 0 && (
              <div className="space-y-1.5">
                <div className="bg-gray-800 px-4 py-2 rounded-t-xl font-bold text-xs text-white uppercase tracking-wider flex justify-between items-center">
                  <span>Part Invoice</span>
                  <span className="text-[10px] text-gray-300 font-normal">Hardware & Replacement Parts</span>
                </div>
                <div className="border border-gray-300 rounded-b-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-300 text-gray-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-3 py-2 text-center w-10">S.No</th>
                        <th className="px-3 py-2 text-left">Description / Part Details</th>
                        <th className="px-3 py-2 text-center w-16">Tax %</th>
                        <th className="px-3 py-2 text-center w-14">Qty</th>
                        <th className="px-3 py-2 text-right w-24">Rate</th>
                        <th className="px-3 py-2 text-right w-20">Discount</th>
                        <th className="px-3 py-2 text-right w-28">Taxable Amt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {lineItems.filter((i: any) => i.type === 'PART' || i.type === 'PRODUCT').map((item: any, idx: number) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2.5 text-center font-mono text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-medium">
                            <div className="text-gray-900">{item.description}</div>
                            {item.warrantyEnabled && (
                              <div className="mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold inline-flex items-center gap-1">
                                <span>🛡️ Warranty: {item.warrantyDuration} {item.warrantyUnit?.toLowerCase()}</span>
                                {item.warrantyCoverage && <span>({item.warrantyCoverage})</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono">{item.taxRate || 0}%</td>
                          <td className="px-3 py-2.5 text-center font-mono">{item.quantity}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{fmt(item.unitPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-red-600">
                            {parseFloat(item.discountAmount) > 0 ? `-${fmt(item.discountAmount)}` : '0.00'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-gray-900 font-bold">{fmt(item.lineTotal)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold text-gray-900 border-t border-gray-300">
                        <td colSpan={6} className="px-4 py-2 text-right uppercase text-[10px] tracking-wider text-gray-600">Part Invoice Subtotal:</td>
                        <td className="px-3 py-2 text-right font-mono text-amber-800 text-sm">
                          {fmt(lineItems.filter((i: any) => i.type === 'PART' || i.type === 'PRODUCT').reduce((s: number, i: any) => s + parseFloat(i.lineTotal), 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LABOUR / SERVICE INVOICE TABLE */}
            {lineItems.filter((i: any) => i.type === 'LABOR' || i.type === 'SERVICE' || i.type === 'OTHER').length > 0 && (
              <div className="space-y-1.5">
                <div className="bg-gray-800 px-4 py-2 rounded-t-xl font-bold text-xs text-white uppercase tracking-wider flex justify-between items-center">
                  <span>Labour Invoice</span>
                  <span className="text-[10px] text-gray-300 font-normal">Service & Repair Charges</span>
                </div>
                <div className="border border-gray-300 rounded-b-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-300 text-gray-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-3 py-2 text-center w-10">S.No</th>
                        <th className="px-3 py-2 text-left">Description / Service</th>
                        <th className="px-3 py-2 text-center w-16">Tax %</th>
                        <th className="px-3 py-2 text-center w-14">Units</th>
                        <th className="px-3 py-2 text-right w-24">Rate/Unit</th>
                        <th className="px-3 py-2 text-right w-20">Discount</th>
                        <th className="px-3 py-2 text-right w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {lineItems.filter((i: any) => i.type === 'LABOR' || i.type === 'SERVICE' || i.type === 'OTHER').map((item: any, idx: number) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2.5 text-center font-mono text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2.5 text-gray-900 font-medium">{item.description}</td>
                          <td className="px-3 py-2.5 text-center font-mono">{item.taxRate || 0}%</td>
                          <td className="px-3 py-2.5 text-center font-mono">{item.quantity}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{fmt(item.unitPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-red-600">
                            {parseFloat(item.discountAmount) > 0 ? `-${fmt(item.discountAmount)}` : '-NIL-'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-gray-900 font-bold">{fmt(item.lineTotal)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold text-gray-900 border-t border-gray-300">
                        <td colSpan={6} className="px-4 py-2 text-right uppercase text-[10px] tracking-wider text-gray-600">Labour Invoice Subtotal:</td>
                        <td className="px-3 py-2 text-right font-mono text-amber-800 text-sm">
                          {fmt(lineItems.filter((i: any) => i.type === 'LABOR' || i.type === 'SERVICE' || i.type === 'OTHER').reduce((s: number, i: any) => s + parseFloat(i.lineTotal), 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WORKSHOP REMARKS & PAYABLE SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-2">
              {/* Left 6 cols: Workshop Remarks */}
              <div className="sm:col-span-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block border-b border-gray-200 pb-1">
                    Workshop Remarks / Recommendation
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed font-sans">
                    {[ticket.reportedIssue, ticket.description, (invoiceData as any)?.notes].filter(Boolean).join(' • ') || 'All requested repairs and services completed satisfactorily.'}
                  </p>
                </div>
              </div>

              {/* Right 6 cols: Amount Payable & In Words */}
              <div className="sm:col-span-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Invoice Amount Payable</span>
                    <span className="text-xl font-mono font-extrabold text-amber-700">{fmt(totals.total)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Amount in Words</span>
                    <p className="text-xs font-mono font-bold text-gray-900 uppercase mt-0.5">{numberToWords(parseFloat(totals.total))}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SYSTEM GENERATED NOTICE (NO SIGNATURE REQUIRED) */}
            <div className="bg-gray-100 border border-gray-300 p-2 rounded-xl text-center">
              <p className="text-[8px] font-medium text-black uppercase tracking-wide font-mono">
                This is a Computer / System Generated Invoice. No Signature Required.
              </p>
            </div>

            {/* FOOTER TERMS & TIMESTAMP BAR */}
            {invoicingSettings?.description && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Terms & Conditions</span>
                <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">{invoicingSettings.description}</p>
              </div>
            )}

            <div className="border-t border-gray-300 pt-3 flex justify-between items-center text-[10px] text-gray-500 font-mono">
              <span>Printed On: {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>Page 1 of 1</span>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d1117] text-white flex flex-col font-sans overflow-hidden">
      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-[#161b22] px-6 py-4 border-b border-[#21262d] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-[#21262d] hover:bg-[#30363d] rounded-lg text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#d99b26]" />
              {isFinalized ? 'Tax Invoice' : 'Billing & Checkout'}
            </h1>
            <p className="text-xs text-[#8b949e]">
              Job #{ticket.jobNumber || ticket.id.slice(0, 8)} · {ticket.customer?.name || 'Walk-in'}
            </p>
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-3">
          {isVoid && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> VOIDED
            </span>
          )}
          {isFinalized && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> FINALIZED
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col xl:flex-row">
        {/* ── LEFT PANEL: Line items list & warranty snapshots ───────────────── */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto print:p-0">
          
          {/* Read Only/Finalized Invoice banner */}
          {isFinalized && (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Finalized Financial Record</p>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  This invoice has been generated and locked. All modification privileges are disabled. Any billing revisions must be handled by voiding this document and starting a new draft.
                </p>
              </div>
            </div>
          )}

          {/* Line items table */}
          <div className="bg-[#161b22] rounded-xl border border-[#21262d] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#21262d]/40 border-b border-[#21262d]">
              <span className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">Invoice items</span>
              {!isFinalized && !isVoid && (
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(true)}
                  className="px-3.5 py-1.5 bg-[#d99b26]/10 border border-[#d99b26]/30 text-[#d99b26] text-xs font-semibold rounded-lg hover:bg-[#d99b26]/20 transition-colors cursor-pointer"
                >
                  + Add Charge Line
                </button>
              )}
            </div>

            <table className="w-full text-sm">
              <thead className="border-b border-[#21262d] bg-[#21262d]/20">
                <tr className="text-[#8b949e] text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Item Details</th>
                  <th className="px-3 py-3 text-center w-16">Qty</th>
                  <th className="px-3 py-3 text-right w-28">Unit Price</th>
                  <th className="px-3 py-3 text-right w-24">Discount</th>
                  <th className="px-3 py-3 text-right w-24">GST</th>
                  <th className="px-3 py-3 text-right w-28">Line Total</th>
                  {!isFinalized && !isVoid && <th className="px-3 py-3 w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {lineItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[#21262d]/30 group">
                    {/* Item Detail */}
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-white font-medium text-sm">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded font-bold uppercase border border-[#30363d]">
                            {item.type}
                          </span>
                          {item.warrantyEnabled && (
                            <span className="text-[9px] bg-[#21262d] text-[#9CA3AF] px-1.5 py-0.5 rounded border border-[#30363d] font-semibold">
                              {item.warrantyDuration} {item.warrantyUnit?.toLowerCase()} warranty
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-3.5 text-center font-mono text-[#8b949e] text-sm">
                      {item.quantity}
                    </td>

                    {/* Unit Price */}
                    <td className="px-3 py-3.5 text-right font-mono text-[#8b949e] text-sm">
                      {fmt(item.unitPrice)}
                    </td>

                    {/* Discount */}
                    <td className="px-3 py-3.5 text-right font-mono text-[#8b949e] text-sm">
                      {parseFloat(item.discountAmount) > 0 ? `-${fmt(item.discountAmount)}` : '—'}
                    </td>

                    {/* GST */}
                    <td className="px-3 py-3.5 text-right font-mono text-[#8b949e] text-xs">
                      {item.taxMode !== 'NONE' ? (
                        <div>
                          <p>{fmt(item.taxAmount)}</p>
                          <p className="text-[9px] text-[#8b949e]">({item.taxRate}%)</p>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Line Total */}
                    <td className="px-3 py-3.5 text-right font-mono text-white font-semibold text-sm">
                      {fmt(item.lineTotal)}
                    </td>

                    {/* Delete button (Draft only) */}
                    {!isFinalized && !isVoid && (
                      <td className="px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer"
                          title="Remove Line Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {lineItems.length === 0 && (
                  <tr>
                    <td colSpan={isFinalized || isVoid ? 6 : 7} className="px-5 py-10 text-center text-[#8b949e] text-sm">
                      No items billed yet. Click <span className="text-[#d99b26]">Add Charge Line</span> to add parts, labor, or service fees.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes and custom layout details (Draft mode only) */}
          {!isFinalized && !isVoid && (
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#d99b26]" /> Invoice Parameters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider mb-1.5">Custom Invoice Number (Optional)</label>
                  <input
                    type="text"
                    value={customInvoiceNumber}
                    onChange={e => setCustomInvoiceNumber(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full h-10 px-3 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-white focus:border-[#d99b26] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-white focus:border-[#d99b26] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider mb-1.5">Custom Invoice Memo</label>
                  <input
                    type="text"
                    value={invoiceNotes}
                    onChange={e => setInvoiceNotes(e.target.value)}
                    placeholder="Printed on customer receipt"
                    className="w-full h-10 px-3 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-white focus:border-[#d99b26] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Void / Reset invoice actions */}
          {isFinalized && !isVoid && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-red-400">Void Invoice</p>
                  <p className="text-xs text-[#8b949e] mt-1">If you need to make changes to line items or prices, you must void this invoice.</p>
                </div>
                <button
                  onClick={() => setShowVoidForm(v => !v)}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-lg transition-colors"
                >
                  Void Invoice
                </button>
              </div>

              {showVoidForm && (
                <div className="bg-[#0d1117] p-4 rounded-lg border border-red-500/20 space-y-3">
                  <label className="block text-xs font-semibold text-white">Reason for Voiding</label>
                  <input
                    type="text"
                    value={voidReason}
                    onChange={e => setVoidReason(e.target.value)}
                    placeholder="Enter audit comment for voiding..."
                    className="w-full h-10 px-3 bg-[#161b22] border border-[#21262d] rounded-lg text-sm text-white focus:border-red-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleVoidInvoice}
                      disabled={voidMutation.isPending}
                      className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                    >
                      {voidMutation.isPending ? 'Processing...' : 'Confirm Void'}
                    </button>
                    <button
                      onClick={() => setShowVoidForm(false)}
                      className="px-4 py-2 bg-[#21262d] text-[#8b949e] text-xs font-semibold rounded-lg hover:bg-[#30363d] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit trail for Void invoices */}
          {isVoid && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 space-y-2">
              <p className="text-sm font-bold text-red-400">Audit Logs: Invoice Voided</p>
              <p className="text-xs text-white">
                <strong>Reason:</strong> {(invoiceData as any).voidReason || 'No reason provided'}
              </p>
              <p className="text-[10px] text-[#8b949e]">
                Voided on {new Date((invoiceData as any).voidedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL (ULTRA-MINIMALIST TEXT-ONLY DESIGN) ───────────── */}
        <div className="w-full xl:w-[420px] shrink-0 border-l border-[#1f293d] bg-[#0b0f19] flex flex-col h-full print:border-l-0 print:border-t overflow-hidden">
          {/* Scrollable Upper Section */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1f293d transparent' }}>

            {/* 1. Customer Card */}
            <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1e293b] text-white font-bold text-sm flex items-center justify-center shrink-0 border border-[#334155]">
                  {ticket.customer?.name ? ticket.customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CU'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white leading-tight truncate">
                    {ticket.customer?.name || 'Walk-in Customer'}
                  </h3>
                  {ticket.customer?.phone && (
                    <p className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                      {ticket.customer.phone}
                    </p>
                  )}
                  <div className="mt-1.5">
                    {((ticket.customer as any)?.isReturning || (ticket.customer as any)?.customerStatusBadge === 'RETURNING CUSTOMER') ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e293b] text-[#D99B26] border border-[#D99B26]/30 uppercase tracking-wide">
                        RETURNING CUSTOMER
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e293b] text-[#D99B26] border border-[#D99B26]/30 uppercase tracking-wide">
                        NEW CUSTOMER
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-[#1f293d] pt-4 text-center">
                <div>
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">TOTAL JOBS</p>
                  <p className="text-sm font-bold text-white mt-1">
                    {(ticket.customer as any)?.totalJobs ?? (ticket.customer as any)?.totalVisits ?? 1}
                  </p>
                </div>
                <div className="border-x border-[#1f293d] px-1">
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">LAST SERVICE</p>
                  <p className="text-xs font-semibold text-white mt-1">
                    {((ticket.customer as any)?.lastService || (ticket.customer as any)?.lastVisit)
                      ? new Date((ticket.customer as any).lastService || (ticket.customer as any).lastVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">LIFETIME SPEND</p>
                  <p className="text-xs font-bold text-white font-mono mt-1">
                    ₹{(((ticket.customer as any)?.lifetimeSpend ?? (ticket.customer as any)?.totalRevenue) ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Amount Summary Card */}
            <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Amount Summary</h3>

              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#9CA3AF]">Sub Total</span>
                  <span className="font-mono font-semibold text-white">{fmt(totals.subtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#9CA3AF]">Discount</span>
                  <span className="font-mono font-semibold text-white">-{fmt(totals.discount)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#9CA3AF]">GST Tax (0%)</span>
                  <span className="font-mono font-semibold text-[#9CA3AF]">{fmt(totals.tax)}</span>
                </div>

                <div className="border-t border-[#1f293d] pt-3 flex justify-between items-center text-sm">
                  <span className="text-white font-bold">Total Amount</span>
                  <span className="font-mono font-bold text-[#D99B26] text-base">{fmt(totals.total)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#9CA3AF]">Paid Amount</span>
                  <span className="font-mono font-semibold text-white">{fmt(totals.amountPaid)}</span>
                </div>
              </div>

              {/* Minimalist Net Payable Box */}
              <div className="bg-[#182030] border border-[#1f293d] rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Net Payable</span>
                <span className="text-lg font-mono font-bold text-white">{fmt(totals.balanceDue)}</span>
              </div>
            </div>

            {/* 3. Received Payment Summary Card (when payments collected) */}
            {(payments.length > 0 || paymentSummary.totalPaid > 0) && (
              <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1f293d] pb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Received Payments</h3>
                  <span className="text-sm font-mono font-bold text-white">Total: {fmt(paymentSummary.totalPaid)}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#182030] p-3 rounded-xl border border-[#1f293d] text-center">
                    <span className="text-[10px] text-[#9CA3AF] font-medium block">UPI / QR</span>
                    <span className="text-xs font-mono font-bold text-white mt-1 block">{fmt(paymentSummary.upiSum)}</span>
                  </div>
                  <div className="bg-[#182030] p-3 rounded-xl border border-[#1f293d] text-center">
                    <span className="text-[10px] text-[#9CA3AF] font-medium block">Card</span>
                    <span className="text-xs font-mono font-bold text-white mt-1 block">{fmt(paymentSummary.cardSum)}</span>
                  </div>
                  <div className="bg-[#182030] p-3 rounded-xl border border-[#1f293d] text-center">
                    <span className="text-[10px] text-[#9CA3AF] font-medium block">Cash</span>
                    <span className="text-xs font-mono font-bold text-white mt-1 block">{fmt(paymentSummary.cashSum)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center text-xs py-2 px-3 bg-[#182030] rounded-xl border border-[#1f293d]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1f293d] text-white">
                          {p.method === 'UPI' ? 'UPI/QR' : p.method === 'CARD' ? 'CARD' : 'CASH'}
                        </span>
                        <span className="text-[#9CA3AF] text-[11px]">{new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <span className="font-mono font-bold text-white">{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Payment Mode Card */}
            <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Payment Mode</h3>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#D99B26] select-none">
                  <div className="relative flex items-center justify-center shrink-0">
                    <input
                      type="checkbox"
                      checked={isBreakdownPayment}
                      onChange={e => setIsBreakdownPayment(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 rounded border border-[#2d3b54] bg-[#111827] peer-checked:bg-[#D99B26] peer-checked:border-[#D99B26] transition flex items-center justify-center">
                      {isBreakdownPayment && <Check className="w-3 h-3 text-[#0d121c] stroke-[3]" />}
                    </div>
                  </div>
                  <span>Split Payment</span>
                </label>
              </div>

              {/* Conditionally show EITHER 3 Single Method Buttons OR Split Payment Inputs */}
              {!isBreakdownPayment ? (
                /* Single Payment Method selection */
                <div className="grid grid-cols-3 gap-2.5">
                  {(['UPI', 'CARD', 'CASH'] as const).map(m => {
                    const isSelected = payMethod === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayMethod(m)}
                        className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#D99B26] border-[#D99B26] text-[#0d121c]'
                            : 'bg-[#182030] border-[#1f293d] text-[#9CA3AF] hover:text-white hover:border-[#2d3b54]'
                        }`}
                      >
                        {m === 'UPI' ? 'UPI / QR' : m === 'CARD' ? 'Card' : 'Cash'}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Split Payment Form Section */
                <div className="bg-[#182030] border border-[#1f293d] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                    <span>ENTER AMOUNTS TO SPLIT</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUpiAmount('');
                        setCardAmount('');
                        setCashAmount('');
                      }}
                      className="text-[#9CA3AF] hover:text-white cursor-pointer normal-case"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-2.5">
                      <label className="block text-[10px] font-semibold text-[#9CA3AF] mb-1">UPI / QR (₹)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={upiAmount}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) setUpiAmount(val);
                        }}
                        placeholder="0.00"
                        className="w-full bg-transparent font-mono text-sm text-white outline-none font-bold placeholder:text-[#475569]"
                      />
                    </div>
                    <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-2.5">
                      <label className="block text-[10px] font-semibold text-[#9CA3AF] mb-1">Card (₹)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cardAmount}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) setCardAmount(val);
                        }}
                        placeholder="0.00"
                        className="w-full bg-transparent font-mono text-sm text-white outline-none font-bold placeholder:text-[#475569]"
                      />
                    </div>
                    <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-2.5">
                      <label className="block text-[10px] font-semibold text-[#9CA3AF] mb-1">Cash (₹)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cashAmount}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) setCashAmount(val);
                        }}
                        placeholder="0.00"
                        className="w-full bg-transparent font-mono text-sm text-white outline-none font-bold placeholder:text-[#475569]"
                      />
                    </div>
                  </div>

                  {/* Breakdown Total Progress */}
                  {(() => {
                    const sum = (parseFloat(upiAmount) || 0) + (parseFloat(cardAmount) || 0) + (parseFloat(cashAmount) || 0);
                    const target = parseFloat(totals.balanceDue) || parseFloat(totals.total) || 1;
                    const pct = Math.min(100, Math.round((sum / target) * 100));

                    return (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-[#9CA3AF]">Total to Pay</span>
                          <span className="font-mono font-bold text-white text-sm">{fmt(sum)}</span>
                        </div>
                        <div className="w-full h-1 bg-[#111827] rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-[#D99B26] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-end text-[10px] text-[#6B7280] font-mono">
                          {pct}%
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Print & Dispatch Options (Finalized) */}
            {isFinalized && (
              <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-3">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Print & Dispatch</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePrint}
                    className="py-2.5 bg-[#182030] hover:bg-[#202c42] text-white text-xs font-semibold rounded-xl transition-colors border border-[#1f293d] cursor-pointer"
                  >
                    Print PDF
                  </button>
                  <button
                    onClick={handleWhatsAppSend}
                    disabled={isSendingWhatsApp}
                    className="py-2.5 bg-[#182030] hover:bg-[#202c42] text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 border border-[#1f293d] cursor-pointer"
                  >
                    {isSendingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : <>WhatsApp Invoice</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. Fixed Checkout Section at Bottom */}
          <div className="p-4 bg-[#0d121c] border-t border-[#1f293d] shrink-0 space-y-2 print:hidden">
            {!isFinalized && !isVoid ? (
              <button
                type="button"
                onClick={handleFinalizeInvoice}
                disabled={finalizeMutation.isPending || lineItems.length === 0}
                className="w-full py-3.5 bg-[#D99B26] hover:bg-[#e5a93c] text-[#0d121c] font-bold text-sm rounded-xl transition-all shadow-md shadow-[#D99B26]/10 flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                {finalizeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Checkout</>
                )}
              </button>
            ) : isFinalized && parseFloat(totals.balanceDue) > 0 ? (
              <button
                type="button"
                onClick={handleCollectPayment}
                disabled={createPaymentMutation.isPending}
                className="w-full py-3.5 bg-[#D99B26] hover:bg-[#e5a93c] text-[#0d121c] font-bold text-sm rounded-xl transition-all shadow-md shadow-[#D99B26]/10 flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                {createPaymentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Collect {fmt(totals.balanceDue)} & Checkout</>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onSuccess}
                className="w-full py-3 bg-[#182030] hover:bg-[#202c42] text-white text-sm font-semibold rounded-xl transition-colors border border-[#1f293d]"
              >
                Return to Ticket View
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── ADD CHARGE LINE MODAL ─────────────────────────────────────────────── */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#111827] border border-[#1f293d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1f293d] flex items-center justify-between bg-[#161f30]">
              <div>
                <h3 className="text-base font-bold text-white">Add Charge Line</h3>
                <p className="text-xs text-[#9CA3AF]">Select category and configure item pricing details</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="w-8 h-8 rounded-lg bg-[#111827] border border-[#1f293d] text-[#9CA3AF] hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* 1. Category Switcher */}
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Charge Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'PART', label: 'Parts & Hardware' },
                    { id: 'LABOR', label: 'Labor & Service' },
                    { id: 'PRODUCT', label: 'Standard Product' },
                    { id: 'OTHER', label: 'Other Expense' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setNewItemType(id as any);
                        setNewItemDesc('');
                        setNewItemPrice('');
                        setNewItemDiscountAmt('');
                        setNewItemDiscountPct('');
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                        newItemType === id
                          ? 'bg-[#D99B26] border-[#D99B26] text-[#0d121c]'
                          : 'bg-[#182030] border-[#1f293d] text-[#9CA3AF] hover:text-white hover:border-[#2d3b54]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Category Specific Fields */}
              {newItemType === 'LABOR' || newItemType === 'SERVICE' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Service Description</label>
                    <input
                      type="text"
                      value={newItemDesc}
                      onChange={e => setNewItemDesc(e.target.value)}
                      placeholder="Enter service or labor description"
                      className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm text-white outline-none focus:border-[#D99B26]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">Technician</label>
                      <input
                        type="text"
                        value={technicianName}
                        onChange={e => setTechnicianName(e.target.value)}
                        placeholder="Assigned technician name"
                        className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm text-white outline-none focus:border-[#D99B26]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">Pricing Model</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPricingMode('FIXED')}
                          className={`h-[50px] rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            pricingMode === 'FIXED' ? 'bg-[#1e293b] border-[#D99B26] text-[#D99B26]' : 'bg-[#182030] border-[#1f293d] text-[#9CA3AF]'
                          }`}
                        >
                          Fixed Rate
                        </button>
                        <button
                          type="button"
                          onClick={() => setPricingMode('HOURLY')}
                          className={`h-[50px] rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            pricingMode === 'HOURLY' ? 'bg-[#1e293b] border-[#D99B26] text-[#D99B26]' : 'bg-[#182030] border-[#1f293d] text-[#9CA3AF]'
                          }`}
                        >
                          Hourly Rate
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">Hours / Qty</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newItemQty}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) setNewItemQty(val);
                        }}
                        placeholder="1"
                        className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">Rate (₹)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newItemPrice}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) setNewItemPrice(val);
                        }}
                        placeholder="0.00"
                        className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">
                        Item / Part Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        placeholder="e.g. OLED Screen Assembly"
                        className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm text-white outline-none focus:border-[#D99B26]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">
                        Description / Remarks
                      </label>
                      <input
                        type="text"
                        value={newItemDesc}
                        onChange={e => setNewItemDesc(e.target.value)}
                        placeholder="e.g. Original Grade A Display"
                        className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm text-white outline-none focus:border-[#D99B26]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">Quantity</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newItemQty}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) setNewItemQty(val);
                        }}
                        placeholder="1"
                        className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">Unit Price (₹)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newItemPrice}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) setNewItemPrice(val);
                        }}
                        placeholder="0.00"
                        className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Discount Fields (Dual Amt vs %) */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Disc. Amt (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newItemDiscountAmt}
                    onChange={e => handleDiscountAmtChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Disc. (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newItemDiscountPct}
                    onChange={e => handleDiscountPctChange(e.target.value)}
                    placeholder="0%"
                    className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26]"
                  />
                </div>
              </div>

              {/* 4. Tax Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Tax Application</label>
                  <div className="relative">
                    <select
                      value={newItemTaxMode}
                      onChange={e => setNewItemTaxMode(e.target.value as any)}
                      className="w-full h-[50px] pl-4 pr-10 bg-[#182030] border border-[#1f293d] rounded-xl text-sm text-white outline-none focus:border-[#D99B26] appearance-none cursor-pointer"
                    >
                      <option value="NONE">No Tax (0%)</option>
                      <option value="EXCLUSIVE">Tax Exclusive (+%)</option>
                      <option value="INCLUSIVE">Tax Inclusive (Embedded %)</option>
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#D99B26]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {newItemTaxMode !== 'NONE' && (
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">GST Rate (%)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newItemTaxRate}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) setNewItemTaxRate(val);
                      }}
                      placeholder="18"
                      className="w-full h-[50px] px-4 bg-[#182030] border border-[#1f293d] rounded-xl text-sm font-mono text-white outline-none focus:border-[#D99B26]"
                    />
                  </div>
                )}
              </div>

              {/* 5. Warranty Coverage Section (With Primary Theme Checkbox) */}
              {(newItemType === 'PART' || newItemType === 'PRODUCT' || newItemType === 'OTHER') && (
                <div className="p-4 bg-[#182030] border border-[#1f293d] rounded-xl space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-white select-none">
                    <div className="relative flex items-center justify-center shrink-0">
                      <input
                        type="checkbox"
                        checked={warrantyEnabled}
                        onChange={e => setWarrantyEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 rounded border border-[#2d3b54] bg-[#111827] peer-checked:bg-[#D99B26] peer-checked:border-[#D99B26] transition flex items-center justify-center">
                        {warrantyEnabled && <Check className="w-3 h-3 text-[#0d121c] stroke-[3]" />}
                      </div>
                    </div>
                    <span>Apply Specific Warranty Coverage</span>
                  </label>

                  {warrantyEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#9CA3AF] mb-1">Duration</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={warrantyDuration}
                          onChange={e => setWarrantyDuration(e.target.value)}
                          className="w-full h-10 px-3 bg-[#111827] border border-[#1f293d] rounded-lg text-xs font-mono text-white outline-none focus:border-[#D99B26]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#9CA3AF] mb-1">Unit</label>
                        <div className="relative">
                          <select
                            value={warrantyUnit}
                            onChange={e => setWarrantyUnit(e.target.value as any)}
                            className="w-full h-10 pl-3 pr-8 bg-[#111827] border border-[#1f293d] rounded-lg text-xs text-white outline-none focus:border-[#D99B26] appearance-none cursor-pointer"
                          >
                            <option value="DAYS">Days</option>
                            <option value="MONTHS">Months</option>
                            <option value="YEARS">Years</option>
                          </select>
                          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#D99B26]">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#9CA3AF] mb-1">Coverage Scope</label>
                        <input
                          type="text"
                          value={warrantyCoverage}
                          onChange={e => setWarrantyCoverage(e.target.value)}
                          placeholder="Coverage scope"
                          className="w-full h-10 px-3 bg-[#111827] border border-[#1f293d] rounded-lg text-xs text-white outline-none focus:border-[#D99B26]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Total Amount Calculation Preview Box */}
              <div className="bg-[#182030] border border-[#1f293d] rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Total Amount</span>
                <span className="text-base font-mono font-bold text-[#D99B26]">
                  ₹{modalLineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#1f293d] bg-[#161f30] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="h-[50px] px-6 bg-[#182030] border border-[#1f293d] text-white text-sm font-semibold rounded-xl hover:bg-[#202c42] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddLineItem}
                disabled={addLineMutation.isPending}
                className="h-[50px] px-8 bg-[#D99B26] hover:bg-[#e5a93c] text-[#0d121c] text-sm font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#D99B26]/10"
              >
                {addLineMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Add Charge Line</>}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
