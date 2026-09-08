import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Loader2, Calendar, Search, Tag, CreditCard, Banknote,
  QrCode, Plus, Trash2, Wrench, Package, Percent, BadgePercent,
  ChevronDown, ChevronUp, MessageSquare, Wallet, Printer, Share2,
  FileText, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, User, Lock, Clock, Check, Truck
} from 'lucide-react';
import { Ticket, ticketsApi } from '../lib/api';
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
import { PartSearchCombo } from '../components/PartSearchCombo';
import { Dialog } from '../components/ui/Dialog';
import { ConfirmationModal } from '../components/ConfirmationModal';

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

function getWarrantyEndDateStr(startDateStr?: string | Date | null, duration?: number | null, unit?: string | null): string {
  if (!duration || duration <= 0) return '';
  const start = startDateStr ? new Date(startDateStr) : new Date();
  const end = new Date(start);
  const u = (unit || 'MONTHS').toUpperCase();
  if (u === 'DAYS') {
    end.setDate(end.getDate() + duration);
  } else if (u === 'YEARS') {
    end.setFullYear(end.getFullYear() + duration);
  } else {
    end.setMonth(end.getMonth() + duration);
  }
  return end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const [newItemCost, setNewItemCost] = useState(''); // Acquisition cost
  const [newItemInventoryItemId, setNewItemInventoryItemId] = useState<string | null>(null);
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDiscountAmt, setNewItemDiscountAmt] = useState('');
  const [newItemDiscountPct, setNewItemDiscountPct] = useState('');
  const [newItemTaxMode, setNewItemTaxMode] = useState<'NONE' | 'EXCLUSIVE' | 'INCLUSIVE'>('INCLUSIVE');
  const [newItemTaxRate, setNewItemTaxRate] = useState('18');
  const [technicianName, setTechnicianName] = useState(ticket.assignedTo?.name || '');
  const [pricingMode, setPricingMode] = useState<'FIXED' | 'HOURLY'>('FIXED');

  // Warranty snapshot inputs
  const [warrantyEnabled, setWarrantyEnabled] = useState(false);
  const [warrantyDuration, setWarrantyDuration] = useState('6');
  const [warrantyUnit, setWarrantyUnit] = useState<'DAYS' | 'MONTHS' | 'YEARS'>('MONTHS');
  const [warrantyCoverage, setWarrantyCoverage] = useState('Full parts and labor warranty');

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [partToDelete, setPartToDelete] = useState<{ id: string; description: string } | null>(null);

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
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Ready for Pickup Handover Payment State
  const isReadyForPickupStatus = ticket.status === 'READY_FOR_PICKUP';
  const [handoverPayMethod, setHandoverPayMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [isHandoverSplitPayment, setIsHandoverSplitPayment] = useState(false);
  const [receivedAmountInput, setReceivedAmountInput] = useState<string>('');
  const [handoverUpiAmount, setHandoverUpiAmount] = useState<string>('');
  const [handoverCardAmount, setHandoverCardAmount] = useState<string>('');
  const [handoverCashAmount, setHandoverCashAmount] = useState<string>('');
  const [isCompletingCheckout, setIsCompletingCheckout] = useState(false);
  const [showHandoverSuccessModal, setShowHandoverSuccessModal] = useState(false);

  // Overall Invoice Discount State
  const [overallDiscountAmt, setOverallDiscountAmt] = useState('');
  const [overallDiscountPct, setOverallDiscountPct] = useState('');

  // ── Derived Invoice Data ───────────────────────────────────────────────────
  const isFinalized = (invoiceData as any)?.status === 'ISSUED' || (invoiceData as any)?.status === 'PAID';
  const isVoid = (invoiceData as any)?.status === 'VOID';
  const lineItems = (invoiceData as any)?.lineItems || (invoiceData as any)?.lineItemsSnapshot || [];

  // Dual discount synchronization helper
  const handleDiscountAmtChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setNewItemDiscountAmt(val);
      const qtyNum = parseFloat(newItemQty) || 1;
      const priceNum = parseFloat(newItemPrice) || 0;
      const gross = qtyNum * priceNum;
      const amtNum = parseFloat(val) || 0;
      if (gross > 0 && amtNum >= 0) {
        const pct = Math.min(100, (amtNum / gross) * 100);
        setNewItemDiscountPct(pct > 0 ? pct.toFixed(2) : '');
      } else {
        setNewItemDiscountPct('');
      }
    }
  };

  const handleDiscountPctChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setNewItemDiscountPct(val);
      const qtyNum = parseFloat(newItemQty) || 1;
      const priceNum = parseFloat(newItemPrice) || 0;
      const gross = qtyNum * priceNum;
      const pctNum = parseFloat(val) || 0;
      if (gross > 0 && pctNum >= 0) {
        const amt = (pctNum / 100) * gross;
        setNewItemDiscountAmt(amt > 0 ? amt.toFixed(2) : '');
      } else {
        setNewItemDiscountAmt('');
      }
    }
  };

  // Real-time calculation preview inside Add Charge Line Modal
  const modalLineTotal = useMemo(() => {
    const qty = parseFloat(newItemQty) || 1;
    const price = parseFloat(newItemPrice) || 0;
    const discAmt = parseFloat(newItemDiscountAmt) || 0;
    const gross = qty * price;
    const afterDisc = Math.max(0, gross - discAmt);

    if (newItemTaxMode === 'EXCLUSIVE') {
      const rate = parseFloat(newItemTaxRate) || 0;
      const tax = afterDisc * (rate / 100);
      return afterDisc + tax;
    }
    return afterDisc;
  }, [newItemQty, newItemPrice, newItemDiscountAmt, newItemTaxMode, newItemTaxRate]);

  // Overall financial totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let lineDiscount = 0;
    let tax = 0;
    let itemsTotal = 0;

    lineItems.forEach((item: any) => {
      subtotal += parseFloat(item.unitPrice || 0) * (item.quantity || 1);
      lineDiscount += parseFloat(item.discountAmount || 0);
      tax += parseFloat(item.taxAmount || 0);
      itemsTotal += parseFloat(item.lineTotal || 0);
    });

    const ovDisc = parseFloat(overallDiscountAmt) || 0;
    const totalDiscount = lineDiscount + ovDisc;
    const finalTotal = Math.max(0, itemsTotal - ovDisc);

    const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    const balanceDue = Math.max(0, finalTotal - totalPaid);

    return {
      subtotal: subtotal.toFixed(2),
      discount: totalDiscount.toFixed(2),
      tax: tax.toFixed(2),
      total: finalTotal.toFixed(2),
      amountPaid: totalPaid.toFixed(2),
      balanceDue: balanceDue.toFixed(2),
    };
  }, [lineItems, payments, overallDiscountAmt]);

  const handleOverallDiscountAmtChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setOverallDiscountAmt(val);
      const amtNum = parseFloat(val) || 0;
      let grossSubtotal = 0;
      lineItems.forEach((item: any) => {
        grossSubtotal += parseFloat(item.unitPrice || 0) * (item.quantity || 1);
      });
      if (grossSubtotal > 0 && amtNum >= 0) {
        const pct = Math.min(100, (amtNum / grossSubtotal) * 100);
        setOverallDiscountPct(pct > 0 ? pct.toFixed(2) : '');
      } else {
        setOverallDiscountPct('');
      }
    }
  };

  const handleOverallDiscountPctChange = (val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setOverallDiscountPct(val);
      const pctNum = parseFloat(val) || 0;
      let grossSubtotal = 0;
      lineItems.forEach((item: any) => {
        grossSubtotal += parseFloat(item.unitPrice || 0) * (item.quantity || 1);
      });
      if (grossSubtotal > 0 && pctNum >= 0) {
        const amt = (pctNum / 100) * grossSubtotal;
        setOverallDiscountAmt(amt > 0 ? amt.toFixed(2) : '');
      } else {
        setOverallDiscountAmt('');
      }
    }
  };

  // Payment Breakdown Summaries
  const paymentSummary = useMemo(() => {
    let upiSum = 0;
    let cardSum = 0;
    let cashSum = 0;

    payments.forEach((p: any) => {
      const amt = parseFloat(p.amount || 0);
      if (p.method === 'UPI' || p.method === 'DIGITAL') upiSum += amt;
      else if (p.method === 'CARD' || p.method === 'POS') cardSum += amt;
      else if (p.method === 'CASH') cashSum += amt;
    });

    return {
      upiSum,
      cardSum,
      cashSum,
      totalPaid: upiSum + cardSum + cashSum
    };
  }, [payments]);

  const associatedPartPaymentAmount = useMemo(() => {
    if (!partToDelete || !payments || payments.length === 0) return 0;
    const descLower = (partToDelete.description || '').toLowerCase();
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

    // Fallback: If 1 part payment and only 1 part line item on the invoice
    const partItems = lineItems.filter((li: any) => li.type === 'PART');
    if (partPayments.length > 0 && partItems.length === 1) {
      return partPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    }

    return 0;
  }, [partToDelete, payments, lineItems]);

  // Synchronize default receiving amount with balance due when ticket status is READY_FOR_PICKUP
  useEffect(() => {
    if (isReadyForPickupStatus && totals.balanceDue) {
      setReceivedAmountInput(totals.balanceDue);
    }
  }, [isReadyForPickupStatus, totals.balanceDue]);

  useEffect(() => {
    if (invoiceData && (invoiceData as any)?.discount) {
      const disc = parseFloat((invoiceData as any).discount) || 0;
      if (disc > 0 && !overallDiscountAmt) {
        setOverallDiscountAmt(disc.toFixed(2));
        const grossSubtotal = lineItems.reduce((acc: number, item: any) => acc + (parseFloat(item.unitPrice || 0) * (item.quantity || 1)), 0);
        if (grossSubtotal > 0) {
          setOverallDiscountPct(((disc / grossSubtotal) * 100).toFixed(2));
        }
      }
    }
  }, [invoiceData, lineItems]);

  const handleCheckoutHandover = async () => {
    const balanceDueNum = parseFloat(totals.balanceDue) || 0;

    if (balanceDueNum > 0) {
      if (isHandoverSplitPayment) {
        const upiVal = parseFloat(handoverUpiAmount) || 0;
        const cardVal = parseFloat(handoverCardAmount) || 0;
        const cashVal = parseFloat(handoverCashAmount) || 0;
        const totalSplit = upiVal + cardVal + cashVal;

        if (Math.abs(totalSplit - balanceDueNum) > 0.01) {
          showToast(
            `Total split payments (${fmt(totalSplit)}) must be equal to invoice balance amount (${fmt(balanceDueNum)})`,
            'warning'
          );
          return;
        }
      } else {
        const receivedNum = parseFloat(receivedAmountInput) || 0;
        if (Math.abs(receivedNum - balanceDueNum) > 0.01) {
          showToast(
            `Received amount (${fmt(receivedNum)}) must be equal to invoice balance amount (${fmt(balanceDueNum)})`,
            'warning'
          );
          return;
        }
      }
    }

    setIsCompletingCheckout(true);
    try {
      if (balanceDueNum > 0) {
        if (isHandoverSplitPayment) {
          const upiVal = parseFloat(handoverUpiAmount) || 0;
          const cardVal = parseFloat(handoverCardAmount) || 0;
          const cashVal = parseFloat(handoverCashAmount) || 0;
          if (upiVal > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: { amount: upiVal, type: 'FINAL', method: 'UPI', notes: 'Checkout payment via UPI' },
            });
          }
          if (cardVal > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: { amount: cardVal, type: 'FINAL', method: 'CARD', notes: 'Checkout payment via Card' },
            });
          }
          if (cashVal > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: { amount: cashVal, type: 'FINAL', method: 'CASH', notes: 'Checkout payment via Cash' },
            });
          }
        } else {
          const receivedNum = parseFloat(receivedAmountInput) || 0;
          if (receivedNum > 0) {
            await createPaymentMutation.mutateAsync({
              ticketId: ticket.id,
              data: {
                amount: receivedNum,
                type: 'FINAL',
                method: handoverPayMethod,
                notes: 'Customer handover checkout payment',
              },
            });
          }
        }
      }

      await ticketsApi.deliver(ticket.id);
      showToast('Checkout complete & Ticket marked Delivered!', 'success');
      setShowHandoverSuccessModal(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to complete checkout', 'warning');
    } finally {
      setIsCompletingCheckout(false);
    }
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleAddLineItem = async () => {
    const desc = newItemDesc.trim() || newItemName.trim() || 'Labour & Charge Line';

    if (!desc) {
      showToast('Item description or name is required', 'warning');
      return;
    }

    try {
      const payload: any = {
        type: newItemType,
        description: desc,
        quantity: Math.max(1, parseFloat(newItemQty) || 1),
        costPrice: newItemCost ? parseFloat(newItemCost) : null,
        inventoryItemId: newItemInventoryItemId || null,
        unitPrice: parseFloat(newItemPrice) || 0,
        discountAmount: parseFloat(newItemDiscountAmt) || 0,
        taxMode: newItemTaxMode,
        taxRate: newItemTaxMode !== 'NONE' ? (parseFloat(newItemTaxRate) || 0) : 0,
      };

      if (warrantyEnabled) {
        payload.warrantyEnabled = true;
        payload.warrantyDuration = parseInt(warrantyDuration) || 6;
        payload.warrantyUnit = warrantyUnit;
        payload.warrantyCoverage = warrantyCoverage;

        const start = new Date();
        const end = new Date(start);
        const dur = payload.warrantyDuration;
        if (warrantyUnit === 'DAYS') end.setDate(end.getDate() + dur);
        else if (warrantyUnit === 'MONTHS') end.setMonth(end.getMonth() + dur);
        else if (warrantyUnit === 'YEARS') end.setFullYear(end.getFullYear() + dur);

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
      setNewItemCost('');
      setNewItemInventoryItemId(null);
      setNewItemPrice('');
      setNewItemDiscountAmt('');
      setNewItemDiscountPct('');
      setWarrantyEnabled(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to add line item', 'warning');
    }
  };

  const confirmDeleteLineItem = async () => {
    if (!partToDelete) return;
    try {
      await removeLineMutation.mutateAsync({ ticketId: ticket.id, lineItemId: partToDelete.id });
      showToast('Line item removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove line item', 'warning');
    } finally {
      setPartToDelete(null);
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
      showToast('Please add at least one line item before marking ready for pickup', 'warning');
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

      showToast('Invoice generated & Ticket marked Ready for Pickup!', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to process invoice', 'warning');
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
        showToast('Payments recorded successfully!', 'success');
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
    if (type === 'PART') return <Package className="w-4 h-4 text-[#116dff]" />;
    if (type === 'LABOR') return <Wrench className="w-4 h-4 text-amber-500" />;
    return <BadgePercent className="w-4 h-4 text-emerald-500" />;
  };

  if (isLoadingInvoice || isLoadingPayments) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center text-[#1e293b] -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#116dff]" />
          <p className="text-sm font-semibold text-slate-500">Loading Invoice details...</p>
        </div>
      </div>
    );
  }

  // ── FINALIZED / COMPLETED CHECKOUT BILL PREVIEW PAGE ───────────────────────
  if (isFinalized) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] text-[#1e293b] flex flex-col font-sans -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
        {/* Sticky Top Header Bar (Matching Header Banner Style) */}
        <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-30 bg-gradient-to-r from-[#dbeafe] via-[#e2e8f0] to-[#f1f5f9] border-b border-[#cbd5e1] px-6 py-4 shadow-xs transition-all backdrop-blur-md print:hidden">
          <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="size-9 rounded-full bg-white border border-[#cbd5e1] text-[#1e293b] flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                title="Back"
              >
                <ArrowLeft className="size-4.5 text-[#1e293b]" />
              </button>
              <div>
                <h1 className="text-xl font-extrabold text-[#1e293b] tracking-tight">
                  Tax Invoice Preview
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Job #{ticket.jobNumber || ticket.id.slice(0, 8)} · {ticket.customer?.name || 'Walk-in'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleWhatsAppSend}
                disabled={isSendingWhatsApp}
                className="px-4 py-2 rounded-full bg-white border border-[#cbd5e1] text-xs font-semibold text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2"
              >
                {isSendingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send WhatsApp</>}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-full bg-white border border-[#cbd5e1] text-xs font-semibold text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Download / Print
              </button>
              <button
                type="button"
                onClick={onSuccess}
                className="px-6 py-2 rounded-full bg-[#116dff] hover:bg-[#0d5fd9] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Done &amp; Return
              </button>
            </div>
          </div>
        </div>

        {/* Printable Bill Preview Container */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
          {/* Authentic White Paper PDF Document Sheet */}
          <div className="invoice-print bg-white text-gray-900 border border-gray-200 rounded-xl p-8 sm:p-10 space-y-6 shadow-xl font-sans print:shadow-none print:border-none print:p-0">

            {/* Top Header: Shop Logo or Name & Details */}
            <div className="flex items-start justify-between border-b border-gray-300 pb-4">
              <div>
                {(invoicingSettings?.logoUrl || (ticket as any).shop?.logoUrl || (ticket as any).tenant?.logoUrl) ? (
                  <img 
                    src={invoicingSettings?.logoUrl || (ticket as any).shop?.logoUrl || (ticket as any).tenant?.logoUrl} 
                    alt="Shop Logo" 
                    className="max-h-16 max-w-[220px] object-contain mb-1" 
                  />
                ) : (
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight uppercase">
                    {invoicingSettings?.name || (ticket as any).shop?.name || (ticket as any).tenant?.name || 'Zevio Tech Repair Services'}
                  </h2>
                )}
                {invoicingSettings?.address && (
                  <p className="text-xs text-gray-600 mt-0.5 leading-tight">{invoicingSettings.address}</p>
                )}
                {invoicingSettings?.phone && (
                  <p className="text-xs font-mono text-gray-600 mt-0.5">Phone: {invoicingSettings.phone}</p>
                )}
              </div>

              <div className="text-right space-y-1">
                <span className="text-sm font-mono font-extrabold text-blue-700 block">
                  #{(invoiceData as any)?.invoiceNumber || `INV-${ticket.id.slice(0, 8).toUpperCase()}`}
                </span>
                <span className={`inline-block px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${parseFloat(totals.balanceDue) <= 0
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
              <div className="space-y-1.5 font-mono">
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Document No.</span><span className="text-gray-900 font-bold">: {(invoiceData as any)?.invoiceNumber || `INV-${ticket.id.slice(0, 8).toUpperCase()}`}</span></div>
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Invoice Date</span><span className="text-gray-800">: {new Date((invoiceData as any)?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div>
                <div className="flex"><span className="w-32 text-gray-500 font-semibold">Billed To</span><span className="text-gray-900 font-bold">: {ticket.customer?.name || 'Walk-in Customer'}</span></div>
              </div>
              <div className="space-y-1.5 font-mono sm:text-right">
                <div className="flex justify-between sm:justify-end gap-2"><span className="text-gray-500 font-semibold">Phone:</span><span className="text-gray-800 font-bold">{ticket.customer?.phone || 'N/A'}</span></div>
                <div className="flex justify-between sm:justify-end gap-2"><span className="text-gray-500 font-semibold">Job ID:</span><span className="text-gray-800 font-bold">#{ticket.jobNumber || ticket.id.slice(0, 8)}</span></div>
                <div className="flex justify-between sm:justify-end gap-2"><span className="text-gray-500 font-semibold">Device:</span><span className="text-gray-800 font-bold">{[ticket.brand, ticket.model].filter(Boolean).join(' ') || 'Device'}</span></div>
              </div>
            </div>

            {/* Invoice Line Items Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-100 border-b border-gray-200 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Item Description</th>
                    <th className="px-3 py-3 text-center">Type</th>
                    <th className="px-3 py-3 text-center">Qty</th>
                    <th className="px-3 py-3 text-right">Unit Price</th>
                    <th className="px-3 py-3 text-right">Discount</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-sans text-gray-800">
                  {lineItems.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {item.description}
                        {item.warrantyEnabled && (
                          <span className="block text-[10px] text-blue-600 font-mono mt-0.5">
                            Warranty: {item.warrantyDuration} {item.warrantyUnit?.toLowerCase()} ({item.warrantyCoverage || 'Standard'})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center uppercase text-[10px] font-bold text-gray-500">{item.type}</td>
                      <td className="px-3 py-3 text-center font-mono font-semibold">{item.quantity}</td>
                      <td className="px-3 py-3 text-right font-mono">{fmt(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right font-mono text-red-600">
                        {parseFloat(item.discountAmount) > 0 ? `-${fmt(item.discountAmount)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{fmt(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payable Summary & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-2">
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

              <div className="sm:col-span-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Invoice Amount Payable</span>
                    <span className="text-xl font-mono font-extrabold text-blue-700">{fmt(totals.total)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Amount in Words</span>
                    <p className="text-xs font-mono font-bold text-gray-900 uppercase mt-0.5">{numberToWords(parseFloat(totals.total))}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Computer Generated Notice */}
            <div className="bg-gray-100 border border-gray-300 p-2 rounded-xl text-center">
              <p className="text-[8px] font-medium text-black uppercase tracking-wide font-mono">
                This is a Computer / System Generated Invoice. No Signature Required.
              </p>
            </div>

            {/* Terms & Conditions */}
            {invoicingSettings?.description && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Terms &amp; Conditions</span>
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

  // ── DRAFT BILLING & CHECKOUT EDITOR VIEW (LIGHT THEME) ─────────────────────
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#1e293b] flex flex-col font-sans">
      {/* ──── TOP BANNER HEADER (STANDALONE FULL-SCREEN) ── */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-[#dbeafe] via-[#e2e8f0] to-[#f1f5f9] border-b border-[#cbd5e1] px-6 py-4 shadow-xs transition-all backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="size-9 rounded-full bg-white border border-[#cbd5e1] text-[#1e293b] flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="size-4.5 text-[#1e293b]" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-[#1e293b] tracking-tight flex items-center gap-2">
                {isFinalized ? 'Tax Invoice' : 'Billing & Checkout'}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Job #{ticket.jobNumber || ticket.id.slice(0, 8)} · {ticket.customer?.name || 'Walk-in'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isVoid && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" /> VOIDED
              </span>
            )}
            {isFinalized && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> FINALIZED
              </span>
            )}
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2 rounded-full bg-white border border-[#cbd5e1] text-xs font-semibold text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col xl:flex-row w-full max-w-7xl mx-auto p-4 sm:p-6 gap-6">
        {/* ── LEFT PANEL: Line items list & parameters ───────────────────────── */}
        <div className="flex-1 space-y-6">

          {/* Read Only/Finalized Invoice banner */}
          {isFinalized && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-900">Finalized Financial Record</p>
                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                  This invoice has been generated and locked. All modification privileges are disabled. Any billing revisions must be handled by voiding this document and starting a new draft.
                </p>
              </div>
            </div>
          )}

          {/* Line items table card */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-6 py-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Services &amp; Invoice Items</span>
              </div>
              {!isFinalized && !isVoid && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => { setNewItemType('OTHER'); setShowAddItemModal(true); }}
                    className="px-5 h-10 rounded-full text-sm font-bold flex items-center gap-2 bg-white border border-blue-200 text-[#116dff] hover:bg-[#116dff] hover:text-white hover:border-[#116dff] transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-current stroke-[2.5]" />
                    <span>Add Charge Line</span>
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <tr className="text-[#64748b] text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">Item Details</th>
                    <th className="px-3 py-3 text-center w-16">Qty</th>
                    <th className="px-3 py-3 text-right w-28">Unit Price</th>
                    <th className="px-3 py-3 text-right w-24">Discount</th>
                    <th className="px-3 py-3 text-right w-24">GST</th>
                    <th className="px-3 py-3 text-right w-28">Line Total</th>
                    {!isFinalized && !isVoid && <th className="px-3 py-3 w-10"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {lineItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Item Detail */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-[#1e293b] font-bold text-sm">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] bg-slate-100 text-[#64748b] px-2 py-0.5 rounded-md font-bold uppercase border border-slate-200">
                              {item.type}
                            </span>
                            {item.warrantyEnabled && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200/80 font-bold">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                {item.warrantyDuration} {item.warrantyUnit?.toLowerCase()} warranty
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="px-3 py-4 text-center font-mono font-bold text-[#1e293b] text-sm">
                        {item.quantity}
                      </td>

                      {/* Unit Price */}
                      <td className="px-3 py-4 text-right font-mono text-slate-700 font-bold text-sm">
                        {fmt(item.unitPrice)}
                      </td>

                      {/* Discount */}
                      <td className="px-3 py-4 text-right font-mono text-rose-600 text-sm font-semibold">
                        {parseFloat(item.discountAmount) > 0 ? `-${fmt(item.discountAmount)}` : '—'}
                      </td>

                      {/* GST */}
                      <td className="px-3 py-4 text-right font-mono text-slate-700 text-xs font-bold">
                        {item.taxMode !== 'NONE' ? (
                          <div>
                            <p className="font-bold text-[#1e293b]">{fmt(item.taxAmount)}</p>
                            <p className="text-[9px] text-slate-400 font-normal">({item.taxRate}%)</p>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Line Total */}
                      <td className="px-3 py-4 text-right font-mono text-[#1e293b] font-extrabold text-sm">
                        {fmt(item.lineTotal)}
                      </td>

                      {/* Delete button (Draft only) */}
                      {!isFinalized && !isVoid && (
                        <td className="px-3 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setPartToDelete({ id: item.id, description: item.description || 'Line Item' })}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                      <td colSpan={isFinalized || isVoid ? 6 : 7} className="px-6 py-12 text-center text-slate-500 text-sm">
                        No items billed yet. Click <span className="font-bold text-[#116dff]">+ Add Charge Line</span> to add parts, labor, or service fees.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Invoice Discount Section */}
          {!isFinalized && !isVoid && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[#1e293b]">Apply discount on the overall invoice?</h3>
                <p className="text-xs text-slate-500 mt-0.5">The overall discount is applicable to services and products.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Disc. by value (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={overallDiscountAmt}
                    onChange={e => handleOverallDiscountAmtChange(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-[#cbd5e1] rounded-xl text-xs font-mono font-bold text-[#1e293b] outline-none focus:bg-white focus:border-[#116dff] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Disc. by percentage (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0%"
                    value={overallDiscountPct}
                    onChange={e => handleOverallDiscountPctChange(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-[#cbd5e1] rounded-xl text-xs font-mono font-bold text-[#1e293b] outline-none focus:bg-white focus:border-[#116dff] transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Void / Reset invoice actions */}
          {isFinalized && !isVoid && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-rose-900">Void Invoice</p>
                  <p className="text-xs text-rose-700 mt-1">If you need to make changes to line items or prices, you must void this invoice.</p>
                </div>
                <button
                  onClick={() => setShowVoidForm(v => !v)}
                  className="px-4 py-2 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Void Invoice
                </button>
              </div>

              {showVoidForm && (
                <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-3">
                  <label className="block text-xs font-semibold text-[#1e293b]">Reason for Voiding</label>
                  <input
                    type="text"
                    value={voidReason}
                    onChange={e => setVoidReason(e.target.value)}
                    placeholder="Enter audit comment for voiding..."
                    className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#1e293b] focus:border-rose-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleVoidInvoice}
                      disabled={voidMutation.isPending}
                      className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      {voidMutation.isPending ? 'Processing...' : 'Confirm Void'}
                    </button>
                    <button
                      onClick={() => setShowVoidForm(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
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
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-2">
              <p className="text-sm font-bold text-rose-900">Audit Logs: Invoice Voided</p>
              <p className="text-xs text-rose-800">
                <strong>Reason:</strong> {(invoiceData as any).voidReason || 'No reason provided'}
              </p>
              <p className="text-[11px] text-rose-600">
                Voided on {new Date((invoiceData as any).voidedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL (CHECKOUT & CUSTOMER SUMMARY) ────────────────────── */}
        <div className="w-full xl:w-[400px] shrink-0 space-y-6 sticky top-24 self-start">

          {/* 1. Customer Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-[#116dff] font-bold text-sm flex items-center justify-center shrink-0 border border-blue-200">
                {ticket.customer?.name ? ticket.customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CU'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#1e293b] leading-tight truncate">
                  {ticket.customer?.name || 'Walk-in Customer'}
                </h3>
                {ticket.customer?.phone && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {ticket.customer.phone}
                  </p>
                )}
                <div className="mt-1.5">
                  {((ticket.customer as any)?.isReturning || (ticket.customer as any)?.customerStatusBadge === 'RETURNING CUSTOMER') ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
                      RETURNING CUSTOMER
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#116dff] border border-blue-200 uppercase tracking-wide">
                      NEW CUSTOMER
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-[#e2e8f0] pt-4 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">TOTAL JOBS</p>
                <p className="text-sm font-bold text-[#1e293b] mt-1">
                  {(ticket.customer as any)?.totalJobs ?? (ticket.customer as any)?.totalVisits ?? 1}
                </p>
              </div>
              <div className="border-x border-[#e2e8f0] px-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">LAST SERVICE</p>
                <p className="text-xs font-semibold text-[#1e293b] mt-1">
                  {((ticket.customer as any)?.lastService || (ticket.customer as any)?.lastVisit)
                    ? new Date((ticket.customer as any).lastService || (ticket.customer as any).lastVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'None'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">LIFETIME SPEND</p>
                <p className="text-xs font-bold text-[#116dff] font-mono mt-1">
                  {fmt(((ticket.customer as any)?.lifetimeSpend ?? (ticket.customer as any)?.totalRevenue) ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Amount Summary Card (POS Bill Summary) */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#1e293b]">Bill summary</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Apply Tax</span>
                <button
                  type="button"
                  onClick={() => setNewItemTaxMode(prev => prev === 'NONE' ? 'INCLUSIVE' : 'NONE')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${newItemTaxMode !== 'NONE' ? 'bg-[#116dff]' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${newItemTaxMode !== 'NONE' ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Sub Total</span>
                <span className="font-mono font-bold text-[#1e293b]">{fmt(totals.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Discount</span>
                <span className="font-mono font-bold text-rose-600">-{fmt(totals.discount)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">GST Tax</span>
                <span className="font-mono font-semibold text-slate-500">{fmt(totals.tax)}</span>
              </div>

              <div className="border-t border-[#e2e8f0] pt-2.5 flex justify-between items-center text-xs">
                <span className="text-[#1e293b] font-bold">Total</span>
                <span className="font-mono font-extrabold text-[#1e293b] text-sm">{fmt(totals.total)}</span>
              </div>

              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-600 font-semibold">Paid Amount</span>
                <span className="font-mono font-bold text-emerald-600">{fmt(totals.amountPaid)}</span>
              </div>
            </div>

            {/* Net Payable Box */}
            <div className="bg-slate-50 border border-[#e2e8f0] rounded-xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-[#1e293b]">Net Payable</span>
              <span className="text-lg font-mono font-black text-[#1e293b]">{fmt(totals.balanceDue)}</span>
            </div>
          </div>

          {/* 3. Received Payment Summary Card */}
          {(payments.length > 0 || paymentSummary.totalPaid > 0) && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                <h3 className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Received Payments</h3>
                <span className="text-xs font-mono font-bold text-[#116dff]">Total: {fmt(paymentSummary.totalPaid)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0] text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">UPI / QR</span>
                  <span className="text-xs font-mono font-bold text-[#1e293b] mt-1 block">{fmt(paymentSummary.upiSum)}</span>
                </div>
                <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0] text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Card</span>
                  <span className="text-xs font-mono font-bold text-[#1e293b] mt-1 block">{fmt(paymentSummary.cardSum)}</span>
                </div>
                <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0] text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Cash</span>
                  <span className="text-xs font-mono font-bold text-[#1e293b] mt-1 block">{fmt(paymentSummary.cashSum)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center text-xs py-2 px-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#116dff] border border-blue-200">
                        {p.method === 'UPI' ? 'UPI/QR' : p.method === 'CARD' ? 'CARD' : 'CASH'}
                      </span>
                      <span className="text-slate-500 text-[11px] font-medium">{new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <span className="font-mono font-bold text-[#1e293b]">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Card: Handover Checkout OR Ready for Pickup OR Return */}
          {isReadyForPickupStatus ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4 shadow-xs animate-in fade-in">
              {/* Card Header Row */}
              <div className="flex items-start justify-between pb-3 border-b border-[#e2e8f0]">
                <div>
                  <h3 className="text-sm font-bold text-[#1e293b]">
                    Customer Checkout &amp; Handover
                  </h3>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Collect final payment and deliver device to customer.
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f8f2] text-[#10b981] uppercase shrink-0 ml-2">
                  READY FOR PICKUP
                </span>
              </div>

              {parseFloat(totals.total) > 0 && parseFloat(totals.amountPaid) >= parseFloat(totals.total) ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full payment already collected for this ticket. Ready for handover!</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Single Payment vs Split Payment Switcher */}
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsHandoverSplitPayment(false)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !isHandoverSplitPayment
                          ? 'bg-[#ede5fa] text-[#6d28d9] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 font-semibold'
                      }`}
                    >
                      Single Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsHandoverSplitPayment(true)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isHandoverSplitPayment
                          ? 'bg-[#ede5fa] text-[#6d28d9] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 font-semibold'
                      }`}
                    >
                      Split Payment
                    </button>
                  </div>

                  {!isHandoverSplitPayment ? (
                    <>
                      {/* Select Payment Method Grid */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#1e293b]">
                          Select Payment Method <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['CASH', 'UPI', 'CARD'] as const).map((m) => {
                            const isSelected = handoverPayMethod === m;
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setHandoverPayMethod(m)}
                                className={`h-11 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer flex items-center justify-center ${
                                  isSelected
                                    ? 'border-[#7c3aed] bg-[#f7f3ff] text-[#6d28d9] shadow-xs'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {m === 'CASH' ? 'Cash' : m === 'UPI' ? 'UPI / QR' : 'Card'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Amount Received Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-[#1e293b]">
                            Amount Received from Customer (₹) <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[11px] text-[#64748b] font-mono">
                            Invoice Balance: <strong className="text-[#1e293b]">{fmt(totals.balanceDue)}</strong>
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={receivedAmountInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) setReceivedAmountInput(val);
                            }}
                            placeholder={totals.balanceDue}
                            className="w-full h-11 pl-8 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-[#1e293b] outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/15 transition-all"
                          />
                        </div>
                        {parseFloat(receivedAmountInput || '0') !== parseFloat(totals.balanceDue) && (
                          <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Received amount must match invoice balance ({fmt(totals.balanceDue)}).</span>
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Split Payment Inputs */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">UPI / QR Payment (₹)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={handoverUpiAmount}
                          onChange={(e) => setHandoverUpiAmount(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono font-bold text-[#1e293b] outline-none focus:border-[#7c3aed]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Card / POS Payment (₹)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={handoverCardAmount}
                          onChange={(e) => setHandoverCardAmount(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono font-bold text-[#1e293b] outline-none focus:border-[#7c3aed]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Cash Payment (₹)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={handoverCashAmount}
                          onChange={(e) => setHandoverCashAmount(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono font-bold text-[#1e293b] outline-none focus:border-[#7c3aed]"
                        />
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-bold">
                        <span>Total Split Entered:</span>
                        <span className="font-mono text-[#6d28d9]">
                          {fmt((parseFloat(handoverUpiAmount) || 0) + (parseFloat(handoverCardAmount) || 0) + (parseFloat(handoverCashAmount) || 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Checkout & Deliver Button */}
              <button
                type="button"
                onClick={handleCheckoutHandover}
                disabled={isCompletingCheckout}
                className="w-full h-12 bg-[#633bf3] hover:bg-[#532de2] text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCompletingCheckout ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Complete Checkout &amp; Deliver</span>
                )}
              </button>
            </div>
          ) : (ticket.status === 'DELIVERED' || ticket.status === 'COMPLETED') ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex flex-col gap-3 shadow-xs text-center">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ticket Delivered &amp; Completed</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHandoverSuccessModal(true)}
                className="w-full h-11 bg-[#633bf3] hover:bg-[#532de2] text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>View Invoice</span>
              </button>
              <button
                type="button"
                onClick={onSuccess}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-[#1e293b] text-xs font-bold rounded-xl transition-colors border border-slate-200 cursor-pointer"
              >
                Return to Ticket View
              </button>
            </div>
          ) : !isFinalized && !isVoid ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-3 shadow-xs">
              <p className="text-xs text-[#64748b]">
                Save line items &amp; price calculations for customer review.
              </p>
              <button
                type="button"
                onClick={handleFinalizeInvoice}
                disabled={finalizeMutation.isPending || lineItems.length === 0}
                className="w-full h-12 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {finalizeMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Truck className="w-5 h-5" />
                    <span>Ready for Pickup</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-3 shadow-xs">
              <button
                type="button"
                onClick={onSuccess}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-[#1e293b] text-xs font-bold rounded-xl transition-colors border border-slate-200 cursor-pointer"
              >
                Return to Ticket View
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── ADD CHARGE LINE MODAL ─────────────────────────────────────────────── */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div>
                <h3 className="text-base font-bold text-[#1e293b]">Add Charge Line</h3>
                <p className="text-xs text-slate-500">Select category and configure item pricing details</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="w-8 h-8 rounded-lg bg-white border border-[#cbd5e1] text-slate-500 hover:text-[#1e293b] hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* 1. Item Description & Price */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">
                    Charge / Labour Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={e => setNewItemDesc(e.target.value)}
                    placeholder="e.g. Screen Replacement Labour, General Servicing"
                    className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#1e293b] outline-none focus:border-[#116dff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Price (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newItemPrice}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) setNewItemPrice(val);
                    }}
                    placeholder="0.00"
                    className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono font-bold text-[#1e293b] outline-none focus:border-[#116dff]"
                  />
                </div>
              </div>

              {/* 2. Discount Fields (Interlinked Amount & %) */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Disc. Amt (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newItemDiscountAmt}
                    onChange={e => handleDiscountAmtChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono text-[#1e293b] outline-none focus:border-[#116dff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Disc. (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newItemDiscountPct}
                    onChange={e => handleDiscountPctChange(e.target.value)}
                    placeholder="0%"
                    className="w-full h-10 px-3.5 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono text-[#1e293b] outline-none focus:border-[#116dff]"
                  />
                </div>
              </div>

              {/* 3. GST Tax Settings Card */}
              <div className="bg-slate-50 border border-[#e2e8f0] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">GST Tax Settings</label>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">GST Rate</label>
                    <div className="relative">
                      <select
                        value={newItemTaxRate}
                        onChange={e => {
                          const rate = e.target.value;
                          setNewItemTaxRate(rate);
                          if (rate === '0') setNewItemTaxMode('NONE');
                          else setNewItemTaxMode('INCLUSIVE');
                        }}
                        className="w-full h-10 pl-3.5 pr-10 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#1e293b] font-semibold outline-none focus:border-[#116dff] appearance-none cursor-pointer"
                      >
                        <option value="0">No Tax (0%)</option>
                        <option value="5">5% GST</option>
                        <option value="12">12% GST</option>
                        <option value="18">18% GST</option>
                        <option value="28">28% GST</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Tax Mode</label>
                    <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-xl border border-[#cbd5e1]">
                      <button
                        type="button"
                        onClick={() => setNewItemTaxMode('INCLUSIVE')}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${newItemTaxMode === 'INCLUSIVE'
                          ? 'bg-[#116dff] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        Included
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItemTaxMode('EXCLUSIVE')}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${newItemTaxMode === 'EXCLUSIVE'
                          ? 'bg-[#116dff] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        Excluded
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Total Amount Calculation Preview Box */}

              {/* 6. Total Amount Calculation Preview Box */}
              <div className="bg-slate-50 border border-[#e2e8f0] rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Total Amount</span>
                <span className="text-base font-mono font-bold text-[#116dff]">
                  ₹{modalLineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="px-5 py-2.5 bg-slate-100 border border-[#cbd5e1] text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddLineItem}
                disabled={addLineMutation.isPending}
                className="px-6 py-2.5 bg-[#116dff] hover:bg-[#0d5fd9] text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
              >
                {addLineMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Add Charge Line</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Line Item Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!partToDelete}
        title="Remove Line Item"
        message={
          partToDelete
            ? associatedPartPaymentAmount > 0
              ? `Are you sure you want to remove "${partToDelete.description}" from this invoice? ⚠️ Note: An advance payment intake of ₹${associatedPartPaymentAmount.toFixed(2)} recorded for this part will ALSO be permanently deleted. This action cannot be undone.`
              : `Are you sure you want to remove "${partToDelete.description}" from this invoice? This action cannot be undone.`
            : ''
        }
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDeleteLineItem}
        onCancel={() => setPartToDelete(null)}
        isLoading={removeLineMutation.isPending}
      />

      {/* ── HANDOVER SUCCESS & TAX INVOICE MODAL ─────────────────────────────── */}
      {showHandoverSuccessModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onSuccess();
            }
          }}
        >
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Top Header Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  ✓
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tax Invoice &amp; Handover Bill</h3>
                  <p className="text-xs text-slate-400">Checkout Complete • Ticket #{ticket.jobNumber || ticket.ticketNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Print or Save PDF Invoice"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download / Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={onSuccess}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  title="Close & Return to Ticket Details"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* WhatsApp Delivery Notice Banner */}
            <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 text-xs font-semibold text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>📱 Bill &amp; Tax Invoice has been successfully delivered to client's WhatsApp ({ticket.customer?.phone || ticket.customer?.name || 'Client'})!</span>
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold uppercase tracking-wider">Delivered</span>
            </div>

            {/* Printable & Screen Invoice Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 font-sans text-slate-800" id="printable-invoice">
              {/* Invoice Top Header */}
              <div className="border border-slate-300 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    {(invoicingSettings?.logoUrl || (ticket as any).shop?.logoUrl || (ticket as any).tenant?.logoUrl) ? (
                      <img 
                        src={invoicingSettings?.logoUrl || (ticket as any).shop?.logoUrl || (ticket as any).tenant?.logoUrl} 
                        alt="Shop Logo" 
                        className="h-14 max-w-[220px] object-contain mb-1" 
                      />
                    ) : (
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        {invoicingSettings?.name || (ticket as any).shop?.name || (ticket as any).tenant?.name || 'ZevioDesk Repair Center'}
                      </h2>
                    )}
                    {(invoicingSettings?.address || (ticket as any).shop?.address || (ticket as any).tenant?.address) && (
                      <p className="text-xs text-slate-600 mt-0.5 max-w-sm">
                        {invoicingSettings?.address || (ticket as any).shop?.address || (ticket as any).tenant?.address}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Mobile: {invoicingSettings?.phone || (ticket as any).shop?.phone || (ticket as any).tenant?.phone || 'N/A'}
                      {invoicingSettings?.gstNumber ? ` • GSTIN: ${invoicingSettings.gstNumber}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg uppercase tracking-wider">TAX INVOICE</span>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">ORIGINAL FOR RECIPIENT</p>
                    <p className="text-xs font-bold text-slate-800 font-mono mt-1">Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-xs font-bold text-slate-800 font-mono">Invoice No: {(invoiceData as any)?.invoiceNumber || `INV-${ticket.jobNumber || ticket.ticketNumber}`}</p>
                  </div>
                </div>

                {/* Bill To & Details Grid */}
                <div className="grid grid-cols-2 gap-6 text-xs pt-1">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Bill To:</span>
                    <p className="font-bold text-slate-900 text-sm">{ticket.customer?.name || 'Customer'}</p>
                    <p className="text-slate-700">Mobile: {ticket.customer?.phone || 'N/A'}</p>
                    {ticket.customer?.email && <p className="text-slate-700">Email: {ticket.customer.email}</p>}
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Ticket Details:</span>
                    <p className="font-bold text-slate-900">Job Reference: #{ticket.jobNumber || ticket.ticketNumber}</p>
                    <p className="text-slate-700">Device: {[ticket.brand, ticket.model].filter(Boolean).join(' ') || ticket.title}</p>
                    <p className="text-slate-700">Payment Status: <strong className="text-slate-900 font-bold">PAID (₹{totals.total})</strong></p>
                  </div>
                </div>
              </div>

              {/* Billed Items Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Product / Service Description &amp; Warranty Details</th>
                      <th className="p-3 w-16 text-center">Qty</th>
                      <th className="p-3 w-24 text-right">Rate (₹)</th>
                      <th className="p-3 w-20 text-right">Disc.</th>
                      <th className="p-3 w-24 text-right">Tax (GST)</th>
                      <th className="p-3 w-28 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lineItems.map((item: any, idx: number) => {
                      const hasWarranty = Boolean(item.warrantyEnabled);
                      const dur = item.warrantyDuration || 90;
                      const unit = item.warrantyUnit || 'DAYS';
                      const expiryDate = item.warrantyEndDate 
                        ? new Date(item.warrantyEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : getWarrantyEndDateStr(item.warrantyStartDate || item.createdAt || ticket.createdAt, dur, unit);

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="p-3 text-center text-slate-700 font-medium">{idx + 1}</td>
                          <td className="p-3 space-y-0.5">
                            <p className="font-bold text-slate-900">{item.description}</p>
                            {hasWarranty && (
                              <div className="text-[11px] text-slate-900 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-300 inline-block mt-1">
                                🛡️ <strong>Part Warranty:</strong> {dur} {unit} (Expiring Date: <strong>{expiryDate}</strong>) — {item.warrantyCoverage || 'Full parts & labor coverage'}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-800">{parseFloat(item.quantity || 1)}</td>
                          <td className="p-3 text-right font-mono font-medium text-slate-900">{fmt(item.unitPrice || 0)}</td>
                          <td className="p-3 text-right font-mono text-slate-900">{parseFloat(item.discountAmount || 0) > 0 ? `-₹${parseFloat(item.discountAmount).toFixed(2)}` : '—'}</td>
                          <td className="p-3 text-right font-mono text-slate-900">{item.taxMode !== 'NONE' ? `₹${parseFloat(item.taxAmount || 0).toFixed(2)}` : '—'}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">{fmt(item.lineTotal || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Invoice Financial Summary Box */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                {/* Amount in words & Bank Details */}
                <div className="border border-slate-300 rounded-xl p-4 space-y-3 text-xs bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-500 text-[10px] uppercase block">Amount in Words:</span>
                    <p className="font-bold text-slate-900">{numberToWords(parseFloat(totals.total))}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-500 text-[10px] uppercase block">Payment Intakes:</span>
                    <p className="text-slate-800 font-mono font-semibold">Total Received: {fmt(totals.total)} (Paid in Full)</p>
                  </div>
                </div>

                {/* Financial Totals Column */}
                <div className="border border-slate-300 rounded-xl p-4 text-xs space-y-2 bg-slate-50">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">₹{totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Total Discount:</span>
                    <span className="font-mono font-bold text-slate-900">-₹{totals.discount}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>GST Tax Amount:</span>
                    <span className="font-mono font-bold text-slate-900">₹{totals.tax}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-2">
                    <span>Total Invoice Amount:</span>
                    <span className="font-mono text-slate-900">₹{totals.total}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-900 border-t border-slate-200 pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-mono text-slate-900">₹{totals.total}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 pt-1">
                    <span>Net Balance Due:</span>
                    <span className="font-mono text-slate-900">₹0.00</span>
                  </div>
                </div>
              </div>

              {/* Terms & Warranty Conditions Box */}
              <div className="border border-slate-300 rounded-xl p-4 text-[11px] text-slate-600 space-y-1.5 bg-slate-50/50">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Terms &amp; Warranty Conditions:</p>
                <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
                  <li>Subject to local service center jurisdiction. E. &amp; O.E.</li>
                  <li>No liability accepted for physical damage, liquid ingress, customer mishandling, or seal tampering after device handover.</li>
                  <li>Spare parts warranty is valid strictly until the specified expiring date shown per item above and covers manufacturing defects only.</li>
                  <li>Any warranty claim requires presenting this tax invoice or job card reference number upon arrival.</li>
                  <li>Goods once sold or parts installed will not be taken back or exchanged for cash.</li>
                </ol>
              </div>

              {/* Signatures Footer Row */}
              <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-slate-600">
                <div className="text-center pt-8 border-t border-slate-300">
                  <p className="font-bold text-slate-800">Customer Signature</p>
                  <p className="text-[10px] text-slate-400">Accepted device in good working condition</p>
                </div>
                <div className="text-center pt-8 border-t border-slate-300">
                  <p className="font-bold text-slate-900">Authorised Signatory</p>
                  <p className="text-[10px] text-slate-500">For {(ticket as any)?.shop?.name || 'ZevioDesk Repair Center'}</p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-11 px-5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Download / Print PDF</span>
              </button>
              <button
                type="button"
                onClick={onSuccess}
                className="h-11 px-8 bg-[#116dff] hover:bg-[#0d5fd9] text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Back to Ticket Details</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
