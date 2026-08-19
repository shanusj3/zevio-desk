/**
 * Legacy billing migration script
 * ────────────────────────────────────────────────────────────────────────────
 * Migrates existing Ticket.laborCost / Ticket.partsCost / Ticket.partsRequired
 * into proper TicketLineItem records, for tickets that don't yet have any
 * line items.
 *
 * Safe to run multiple times — skips tickets that already have line items.
 *
 * Run with:
 *   npx ts-node --project tsconfig.json scripts/migrate-legacy-billing.ts
 *   — or —
 *   npx tsx scripts/migrate-legacy-billing.ts
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting legacy billing migration...");

  // Load all tickets that have legacy cost data and NO existing line items
  const tickets = await prisma.ticket.findMany({
    where: {
      lineItems: { none: {} },
      OR: [
        { laborCost:  { not: null } },
        { partsCost:  { not: null } },
        { partsRequired: { not: Prisma.AnyNull } },
      ],
    },
    select: {
      id: true,
      tenantId: true,
      laborCost: true,
      partsCost: true,
      partsRequired: true,
      laborDescription: true,
      tax: true,
    },
  });

  console.log(`📋 Found ${tickets.length} ticket(s) to migrate`);

  let migrated = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const ticket of tickets) {
    try {
      const itemsToCreate: Prisma.TicketLineItemCreateManyInput[] = [];

      // ── 1. Labor cost line ─────────────────────────────────────────────────
      const laborCost = ticket.laborCost ? new Decimal(ticket.laborCost.toString()) : null;
      if (laborCost && laborCost.gt(0)) {
        itemsToCreate.push({
          ticketId:    ticket.id,
          tenantId:    ticket.tenantId,
          type:        "LABOR",
          description: ticket.laborDescription?.trim() || "Labour charges",
          quantity:    new Decimal(1),
          unitPrice:   laborCost,
          discountAmount: new Decimal(0),
          subtotal:    laborCost,
          taxMode:     "NONE",
          taxRate:     new Decimal(0),
          taxAmount:   new Decimal(0),
          lineTotal:   laborCost,
          warrantyEnabled: false,
        });
      }

      // ── 2. Parts — prefer structured partsRequired over flat partsCost ─────
      const partsReq = ticket.partsRequired as any;
      const hasStructuredParts = Array.isArray(partsReq) && partsReq.length > 0;

      if (hasStructuredParts) {
        // Structured parts — each part becomes its own line item.
        // However, these legacy records don't have per-part pricing.
        // We'll distribute partsCost equally across parts if available,
        // otherwise default each to 0 (to be corrected manually).
        const partsCostTotal = ticket.partsCost
          ? new Decimal(ticket.partsCost.toString())
          : new Decimal(0);
        const perPartCost = partsReq.length > 0 && partsCostTotal.gt(0)
          ? partsCostTotal.div(partsReq.length).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
          : new Decimal(0);

        for (const part of partsReq) {
          const qty = new Decimal(Number(part.quantity ?? 1));
          // If cost per part is known, use it; otherwise use distributed amount
          const unitPrice = part.unitPrice
            ? new Decimal(part.unitPrice.toString())
            : perPartCost.gt(0) ? perPartCost.div(qty).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            : new Decimal(0);
          const subtotal  = unitPrice.mul(qty).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

          itemsToCreate.push({
            ticketId:    ticket.id,
            tenantId:    ticket.tenantId,
            type:        "PART",
            description: [part.name, part.partNumber ? `(${part.partNumber})` : "", part.sourcedFrom ? `— ${part.sourcedFrom}` : ""]
                           .filter(Boolean).join(" ").trim() || "Part",
            quantity:    qty,
            unitPrice,
            discountAmount: new Decimal(0),
            subtotal,
            taxMode:     "NONE",
            taxRate:     new Decimal(0),
            taxAmount:   new Decimal(0),
            lineTotal:   subtotal,
            warrantyEnabled: false,
          });
        }
      } else {
        // Only a flat partsCost — create one generic PART line
        const partsCost = ticket.partsCost ? new Decimal(ticket.partsCost.toString()) : null;
        if (partsCost && partsCost.gt(0)) {
          itemsToCreate.push({
            ticketId:    ticket.id,
            tenantId:    ticket.tenantId,
            type:        "PART",
            description: "Parts & materials",
            quantity:    new Decimal(1),
            unitPrice:   partsCost,
            discountAmount: new Decimal(0),
            subtotal:    partsCost,
            taxMode:     "NONE",
            taxRate:     new Decimal(0),
            taxAmount:   new Decimal(0),
            lineTotal:   partsCost,
            warrantyEnabled: false,
          });
        }
      }

      if (itemsToCreate.length === 0) {
        skipped++;
        continue;
      }

      await prisma.ticketLineItem.createMany({ data: itemsToCreate });
      migrated++;

      if (migrated % 50 === 0) {
        console.log(`  ✅ Migrated ${migrated} ticket(s)...`);
      }
    } catch (err) {
      errors++;
      console.error(`  ❌ Failed to migrate ticket ${ticket.id}:`, err);
    }
  }

  console.log("\n── Migration Summary ────────────────────────────────────────");
  console.log(`   Migrated : ${migrated}`);
  console.log(`   Skipped  : ${skipped} (no billable amounts)`);
  console.log(`   Errors   : ${errors}`);
  console.log("─────────────────────────────────────────────────────────────\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
