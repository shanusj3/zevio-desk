import { prisma } from "../../config/prisma.js";
import { StockMovementType } from "@prisma/client";

/**
 * StockMovementService
 *
 * This is the ONLY module that may directly mutate InventoryItem.currentStock
 * in response to ticket line item operations. Every change creates an
 * immutable StockMovement record in the same transaction.
 *
 * Key rules:
 * - Always called inside a Prisma transaction.
 * - Delta is calculated from (newQuantity - existingQuantity), not from movement history.
 * - One TicketLineItem may produce multiple StockMovement rows (add, adjust, return).
 * - Negative stock is allowed (warn on the UI, but never block the operation).
 */
export const stockMovementService = {
  /**
   * Consume stock when a new inventory-linked line item is saved to a ticket.
   * Called by: lineItemService.add()
   */
  consumeStock: async (
    tx: any, // Prisma transaction client
    opts: {
      tenantId: string;
      inventoryItemId: string;
      quantity: number;       // The quantity being consumed (positive integer)
      ticketLineItemId: string;
      reference?: string;     // e.g. "TK-1042"
      createdById?: string;
    }
  ) => {
    const { tenantId, inventoryItemId, quantity, ticketLineItemId, reference, createdById } = opts;

    const item = await tx.inventoryItem.findFirst({
      where: { id: inventoryItemId, tenantId },
    });
    if (!item) return; // Item may have been deactivated — silently skip

    const previousStock = item.currentStock;
    const newStock = previousStock - quantity;

    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data:  { currentStock: newStock },
    });

    await tx.stockMovement.create({
      data: {
        tenantId,
        inventoryItemId,
        type:            "STOCK_OUT" as StockMovementType,
        quantity:        -quantity,   // Stored as negative
        previousStock,
        newStock,
        reference:       reference || null,
        ticketLineItemId,
        createdById:     createdById || null,
      },
    });

    return { previousStock, newStock };
  },

  /**
   * Adjust stock when the quantity of an inventory-linked line item changes.
   * Delta = newQuantity - existingQuantity.
   * Called by: lineItemService.update()
   */
  adjustByDelta: async (
    tx: any,
    opts: {
      tenantId: string;
      inventoryItemId: string;
      existingQuantity: number;  // The quantity already consumed (before this update)
      newQuantity: number;       // The new desired quantity
      ticketLineItemId: string;
      reference?: string;
      createdById?: string;
    }
  ) => {
    const { tenantId, inventoryItemId, existingQuantity, newQuantity, ticketLineItemId, reference, createdById } = opts;

    const delta = newQuantity - existingQuantity;
    if (delta === 0) return; // No change — nothing to do

    const item = await tx.inventoryItem.findFirst({
      where: { id: inventoryItemId, tenantId },
    });
    if (!item) return;

    const previousStock = item.currentStock;
    const newStock = previousStock - delta; // Consuming more = stock decreases

    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data:  { currentStock: newStock },
    });

    await tx.stockMovement.create({
      data: {
        tenantId,
        inventoryItemId,
        type:            delta > 0 ? ("STOCK_OUT" as StockMovementType) : ("RETURN" as StockMovementType),
        quantity:        -delta,  // Stored as the actual stock change (negative = consumed)
        previousStock,
        newStock,
        reason:          `Quantity changed from ${existingQuantity} to ${newQuantity}`,
        reference:       reference || null,
        ticketLineItemId,
        createdById:     createdById || null,
      },
    });

    return { previousStock, newStock, delta };
  },

  /**
   * Restore stock when a line item linked to inventory is removed.
   * Creates a RETURN movement for the full quantity that was consumed.
   * Called by: lineItemService.remove()
   */
  returnStock: async (
    tx: any,
    opts: {
      tenantId: string;
      inventoryItemId: string;
      quantity: number;          // Quantity to restore (positive)
      ticketLineItemId: string;
      reference?: string;
      reason?: string;
      createdById?: string;
    }
  ) => {
    const { tenantId, inventoryItemId, quantity, ticketLineItemId, reference, reason, createdById } = opts;

    const item = await tx.inventoryItem.findFirst({
      where: { id: inventoryItemId, tenantId },
    });
    if (!item) return;

    const previousStock = item.currentStock;
    const newStock = previousStock + quantity;

    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data:  { currentStock: newStock },
    });

    await tx.stockMovement.create({
      data: {
        tenantId,
        inventoryItemId,
        type:            "RETURN" as StockMovementType,
        quantity:        +quantity,   // Stored as positive (stock returned)
        previousStock,
        newStock,
        reason:          reason || "Part removed from ticket",
        reference:       reference || null,
        ticketLineItemId,
        createdById:     createdById || null,
      },
    });

    return { previousStock, newStock };
  },

  /**
   * Return all stock consumed by a ticket's inventory-linked line items.
   * Called when a ticket is cancelled to reverse all STOCK_OUT movements.
   */
  returnAllForTicket: async (
    tx: any,
    opts: {
      tenantId: string;
      ticketId: string;
      ticketReference?: string;
      cancelledById?: string;
    }
  ) => {
    const { tenantId, ticketId, ticketReference, cancelledById } = opts;

    // Get all inventory-linked line items for this ticket
    const lineItems = await tx.ticketLineItem.findMany({
      where: { ticketId, inventoryItemId: { not: null } },
      select: { id: true, inventoryItemId: true, quantity: true },
    });

    for (const lineItem of lineItems) {
      if (!lineItem.inventoryItemId) continue;

      const item = await tx.inventoryItem.findFirst({
        where: { id: lineItem.inventoryItemId, tenantId },
      });
      if (!item) continue;

      const quantity = Number(lineItem.quantity);
      const previousStock = item.currentStock;
      const newStock = previousStock + quantity;

      await tx.inventoryItem.update({
        where: { id: lineItem.inventoryItemId },
        data:  { currentStock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          inventoryItemId:  lineItem.inventoryItemId,
          type:             "RETURN" as StockMovementType,
          quantity:         +quantity,
          previousStock,
          newStock,
          reason:           "Ticket cancelled",
          reference:        ticketReference || null,
          ticketLineItemId: lineItem.id,
          createdById:      cancelledById || null,
        },
      });
    }
  },
};
