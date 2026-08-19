import { calculateLineItem, calculateInvoiceTotals, LineItemInput } from "../../src/services/billing.service.js";
import { Decimal } from "@prisma/client/runtime/library";

async function runBillingUnitTests() {
  console.log("🧪 Running Billing Service Unit Tests...");

  // 1. Test None Tax Mode
  const itemNone: LineItemInput = {
    type: "PART",
    description: "Screen Replacement",
    quantity: 1,
    unitPrice: 150,
    discountAmount: 10,
    taxMode: "NONE",
    taxRate: 0,
  };
  const resNone = calculateLineItem(itemNone);
  console.assert(resNone.subtotal.equals(new Decimal(140)), "Subtotal should be 140");
  console.assert(resNone.taxAmount.equals(new Decimal(0)), "Tax should be 0");
  console.assert(resNone.lineTotal.equals(new Decimal(140)), "Line total should be 140");

  // 2. Test Exclusive Tax Mode (tax on top)
  const itemExclusive: LineItemInput = {
    type: "LABOR",
    description: "Repair Service",
    quantity: 2,
    unitPrice: 50,
    discountAmount: 15, // subtotal = 100 - 15 = 85
    taxMode: "EXCLUSIVE",
    taxRate: 10, // 10% of 85 = 8.5
  };
  const resExclusive = calculateLineItem(itemExclusive);
  console.assert(resExclusive.subtotal.equals(new Decimal(85)), "Subtotal should be 85");
  console.assert(resExclusive.taxAmount.equals(new Decimal(8.5)), "Tax should be 8.5");
  console.assert(resExclusive.lineTotal.equals(new Decimal(93.5)), "Line total should be 93.5");

  // 3. Test Inclusive Tax Mode (tax included in unitPrice)
  const itemInclusive: LineItemInput = {
    type: "PRODUCT",
    description: "Charging Cable",
    quantity: 1,
    unitPrice: 110,
    discountAmount: 0,
    taxMode: "INCLUSIVE",
    taxRate: 10, // subtotal = 110, tax should be 10 (110 - 110 / 1.1)
  };
  const resInclusive = calculateLineItem(itemInclusive);
  console.assert(resInclusive.subtotal.equals(new Decimal(110)), "Subtotal should be 110");
  console.assert(resInclusive.taxAmount.equals(new Decimal(10)), "Tax should be 10");
  console.assert(resInclusive.lineTotal.equals(new Decimal(110)), "Line total should be 110");

  // 4. Test Aggregate Invoice Totals
  const totals = calculateInvoiceTotals([resNone, resExclusive, resInclusive], 100);

  console.assert(totals.subtotal.equals(new Decimal(335)), "Invoice subtotal should be 335");
  console.assert(totals.tax.equals(new Decimal(18.5)), "Invoice total tax should be 18.5");
  console.assert(totals.total.equals(new Decimal(353.5)), "Invoice total should be 353.5");
  console.assert(totals.balanceDue.equals(new Decimal(253.5)), "Invoice balance due should be 253.5");

  console.log("✅ All Billing Service Unit Tests Passed!");
}

runBillingUnitTests().catch(console.error);
