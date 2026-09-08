import { TicketStatus } from "@prisma/client";
import { ticketRepository } from "./ticket.repository.js";
import { CreateTicketDto, UpdateTicketDto, ALL_UPDATE_FIELDS } from "./ticket.types.js";
import { generateJobNumber } from "../../utils/generateJobNumber.js";
import { generateTicketAttachmentPresign } from "../../services/s3-upload.service.js";
import { prisma } from "../../config/prisma.js";
import { paymentService } from "../payment/payment.service.js";
import { enrichTicketWithPaymentSummary } from "../payment/payment.utils.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../errors/AppError.js";
import { catalogService } from "../catalog/catalog.service.js";
import { randomBytes } from "crypto";
import { stockMovementService } from "../inventory/stock-movement.service.js";
import { emitTicketAssigned } from "../../socket/index.js";

/**
 * Validates that a technician can be assigned a new ticket:
 *  1. The user exists and belongs to the given tenant.
 *  2. If the user has a maxConcurrentJobs limit, they have not yet reached it
 *     (counting tickets in active, non-terminal statuses).
 *
 * Pass `excludeTicketId` when re-assigning an existing ticket so the ticket
 * being updated is not counted against the technician's current workload.
 */
async function assertAssigneeCapacity(
  assignedToId: string,
  tenantId: string,
  excludeTicketId?: string
): Promise<void> {
  const { userRepository } = await import("../user/user.repository.js");
  const user = await userRepository.findById(assignedToId);

  if (!user || user.tenantId !== tenantId) {
    throw new ValidationError("Invalid assignedToId: user does not belong to this tenant");
  }

  const maxJobs = (user as any).maxConcurrentJobs as number | null | undefined;
  if (maxJobs != null && maxJobs > 0) {
    // Technician active workload: only pre-completion statuses count towards concurrent job limit
    const ACTIVE_STATUSES: TicketStatus[] = ["RECEIVED", "DIAGNOSING", "WAITING_FOR_PARTS", "IN_PROGRESS"];
    const activeCount = await prisma.ticket.count({
      where: {
        assignedToId,
        status: { in: ACTIVE_STATUSES },
        ...(excludeTicketId ? { id: { not: excludeTicketId } } : {}),
      },
    });

    if (activeCount >= maxJobs) {
      throw new ValidationError(
        `Technician has reached their maximum concurrent job limit (${maxJobs}). ` +
        `They currently have ${activeCount} active ticket(s). ` +
        `Please reassign or complete an existing ticket first.`
      );
    }
  }
}

async function enrichCustomerStats(ticket: any) {
  if (ticket && ticket.customerId && ticket.customer) {
    const completedStatuses = ["REPAIR_COMPLETED", "READY_FOR_PICKUP", "DELIVERED", "COMPLETED"];

    const [totalJobs, completedJobsCount, paymentAgg, lineItemsAgg, ticketBilledAgg, latestCompletedTicket] = await Promise.all([
      prisma.ticket.count({ where: { customerId: ticket.customerId } }),
      prisma.ticket.count({ where: { customerId: ticket.customerId, status: { in: completedStatuses as any } } }),
      prisma.payment.aggregate({
        where: { ticket: { customerId: ticket.customerId } },
        _sum: { amount: true },
      }),
      prisma.ticketLineItem.aggregate({
        where: { ticket: { customerId: ticket.customerId } },
        _sum: { lineTotal: true },
      }),
      prisma.ticket.aggregate({
        where: { customerId: ticket.customerId },
        _sum: { totalAmount: true },
      }),
      prisma.ticket.findFirst({
        where: { customerId: ticket.customerId, status: { in: completedStatuses as any } },
        orderBy: { updatedAt: "desc" },
        select: { createdAt: true, actualCompletionDate: true, updatedAt: true },
      }),
    ]);

    const paymentTotal = paymentAgg._sum.amount ? Number(paymentAgg._sum.amount) : 0;
    const lineItemsTotal = lineItemsAgg._sum.lineTotal ? Number(lineItemsAgg._sum.lineTotal) : 0;
    const billedTotal = ticketBilledAgg._sum.totalAmount ? Number(ticketBilledAgg._sum.totalAmount) : 0;
    const lifetimeSpend = Math.max(paymentTotal, lineItemsTotal, billedTotal);

    const lastService = latestCompletedTicket
      ? (latestCompletedTicket.actualCompletionDate || latestCompletedTicket.updatedAt || latestCompletedTicket.createdAt)
      : null;

    const isReturning = totalJobs > 1 || completedJobsCount > 0;

    ticket.customer = {
      ...ticket.customer,
      totalJobs,
      totalVisits: totalJobs,
      lifetimeSpend,
      totalRevenue: lifetimeSpend,
      lastService,
      lastVisit: lastService,
      isReturning,
      customerStatusBadge: isReturning ? "RETURNING CUSTOMER" : "NEW CUSTOMER",
    };
  }
  return ticket;
}

export const ticketService = {
  getTickets: async (
    tenantId?: string,
    status?: string,
    assignedToId?: string,
    startDate?: Date,
    endDate?: Date,
    role?: string,
    statusIn?: string[],
    skip?: number,
    take?: number,
    search?: string,
    priority?: string
  ) => {
    let allowedStatuses: string[] | undefined = undefined;

    if (role === "TECHNICIAN") {
      allowedStatuses = ["RECEIVED", "DIAGNOSING", "WAITING_FOR_PARTS", "IN_PROGRESS", "REPAIR_COMPLETED"];
    } else if (role === "ADVISOR" || role === "TENANT_ADMIN" || role === "MANAGER" || role === "SUPER_ADMIN") {
      allowedStatuses = [
        "RECEIVED", "DIAGNOSING", "WAITING_FOR_PARTS", "IN_PROGRESS",
        "REPAIR_COMPLETED", "READY_FOR_PICKUP", "DELIVERED", "COMPLETED", "CANCELLED"
      ];
    }

    let resolvedStatusIn = statusIn;
    if (allowedStatuses && status && status !== "All") {
      // Specific status requested
      resolvedStatusIn = [status];
    } else if (allowedStatuses) {
      if (resolvedStatusIn && resolvedStatusIn.length > 0) {
        resolvedStatusIn = resolvedStatusIn.filter((s) => allowedStatuses!.includes(s));
        if (resolvedStatusIn.length === 0) {
          return { data: [], total: 0 };
        }
      }
    }

    return ticketRepository.findAll(
      tenantId,
      status,
      assignedToId,
      startDate,
      endDate,
      resolvedStatusIn,
      skip,
      take,
      search,
      priority
    );
  },

  getRepairCompleted: async (tenantId?: string) => {
    if (!tenantId) throw new ValidationError("Tenant context missing");
    return ticketRepository.findRepairCompleted(tenantId);
  },

  getReadyForPickup: async (tenantId?: string) => {
    if (!tenantId) throw new ValidationError("Tenant context missing");
    return ticketRepository.findReadyForPickup(tenantId);
  },

  completeRepair: async (id: string, tenantId?: string, actorId?: string, actorRole?: string) => {
    if (!tenantId) throw new ValidationError("Tenant context missing");
    const ticket = await prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundError("Ticket not found");

    if (actorRole === "TECHNICIAN" && ticket.assignedToId !== actorId) {
      throw new ForbiddenError("Technicians can only complete repairs assigned to them");
    }

    const ALLOWED_FROM_STATUSES = ["RECEIVED", "DIAGNOSING", "WAITING_FOR_PARTS", "IN_PROGRESS"];
    if (!ALLOWED_FROM_STATUSES.includes(ticket.status)) {
      if (ticket.status === "REPAIR_COMPLETED") {
        throw new ValidationError("Repair has already been marked as completed.");
      }
      throw new ValidationError(`Cannot complete repair from status ${ticket.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id },
        data: {
          status: "REPAIR_COMPLETED",
          actualCompletionDate: new Date(),
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          ticketId: id,
          status: "REPAIR_COMPLETED",
          customerNote: "Technical repair completed by technician. Awaiting invoice processing.",
          createdById: actorId,
        },
      });

      emitTicketAssigned(updated);
      return updated;
    });
  },

  deliverTicket: async (id: string, tenantId?: string, actorId?: string) => {
    if (!tenantId) throw new ValidationError("Tenant context missing");
    const ticket = await prisma.ticket.findFirst({ where: { id, tenantId }, include: { invoice: true } });
    if (!ticket) throw new NotFoundError("Ticket not found");
    if (ticket.status !== "READY_FOR_PICKUP") {
      throw new ValidationError("Only tickets ready for pickup can be delivered");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id },
        data: {
          status: "DELIVERED",
          pickupDate: new Date(),
          actualCompletionDate: ticket.actualCompletionDate || new Date(),
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          ticketId: id,
          status: "DELIVERED",
          customerNote: "Device physically handed over to customer.",
          createdById: actorId,
        },
      });

      emitTicketAssigned(updated);
      return updated;
    });
  },

  // ─── Queries ──────────────────────────────────────────────────────────────────
  getTicketById: async (id: string) => {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) throw new NotFoundError("Ticket not found");

    if (!ticket.trackingToken) {
      const { randomBytes } = await import("crypto");
      const generatedToken = `tk_${randomBytes(12).toString("hex")}`;
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { trackingToken: generatedToken },
      });
      (ticket as any).trackingToken = generatedToken;
    }

    const enriched = enrichTicketWithPaymentSummary(ticket);
    await enrichCustomerStats(enriched);
    return enriched;
  },

  /** Authenticated lookup: an opaque ID or ticket number is always scoped to the JWT tenant. */
  getTicketByReference: async (reference: string, tenantId?: string) => {
    const ticket = await (prisma.ticket as any).findFirst({
      where: tenantId
        ? { tenantId, OR: [{ id: reference }, { ticketNumber: reference }] }
        : { id: reference },
      include: {
        customer: true,
        assignedTo: { select: { name: true, email: true } },
        payments: { orderBy: { paidAt: "desc" }, include: { recordedBy: { select: { name: true } } } },
      },
    });
    if (!ticket) throw new NotFoundError("Ticket not found");
    const enriched = enrichTicketWithPaymentSummary(ticket);
    await enrichCustomerStats(enriched);
    return enriched;
  },

  createTicket: async (dto: CreateTicketDto, recordedById?: string) => {
    if (!dto.tenantId) throw new ValidationError("Tenant ID is required");
    if (!dto.customerId) throw new ValidationError("Customer is required");

    const { customerRepository } = await import("../customer/customer.repository.js");
    const customer = await customerRepository.findById(dto.customerId);
    if (!customer || customer.tenantId !== dto.tenantId) {
       throw new ValidationError("Invalid customer or customer does not belong to this tenant");
    }

    if (dto.assignedToId) {
      await assertAssigneeCapacity(dto.assignedToId, dto.tenantId);
    }

    const jobNumber = await generateJobNumber(dto.tenantId);

    const ticket = await prisma.$transaction(async (tx) => {
      // Atomic database increment prevents concurrent creations from sharing a
      // tenant-visible ticket number.
      const counter = await (tx as any).ticketCounter.upsert({
        where: { tenantId: dto.tenantId! },
        create: { tenantId: dto.tenantId!, ticketSequence: 1 },
        update: { ticketSequence: { increment: 1 } },
      });
      const ticketNumber = `TK-${String(counter.ticketSequence).padStart(4, "0")}`;
      // Resolve catalog item inside the transaction
      const resolved = await catalogService.resolveCatalogItemTx(
        tx,
        dto.model || "",
        dto.itemCategory,
        dto.brand,
        dto.tenantId,
        recordedById
      );

      // Create ticket with resolved IDs and values
      const newTicket = await tx.ticket.create({
        data: {
          tenantId: dto.tenantId!,
          customerId: dto.customerId,
          assignedToId: dto.assignedToId || null,
          jobNumber,
          ticketNumber,
          publicToken: randomBytes(32).toString("hex"),
          title: dto.title || `${resolved.resolvedCategory}${resolved.resolvedModel ? ` - ${resolved.resolvedModel}` : ''}`,
          description: dto.description || 'Ticket created from intake form.',
          priority: dto.priority || "NORMAL",
          status: dto.status || "RECEIVED",
          estimatedCompletionDate: dto.estimatedCompletionDate
            ? new Date(dto.estimatedCompletionDate)
            : null,
          itemCategory: resolved.resolvedCategory,
          brand: resolved.resolvedBrand,
          model: resolved.resolvedModel,
          globalCatalogItemId: resolved.globalCatalogItemId,
          tenantCatalogItemId: resolved.tenantCatalogItemId,
          serialNumber: dto.serialNumber,
          itemCondition: dto.itemCondition,
          accessories: dto.accessories,
          reportedIssue: dto.reportedIssue,
          techDiagnosis: dto.techDiagnosis,
          diagnosisNotes: dto.diagnosisNotes,
          rootCause: dto.rootCause,
          partsRequired: (dto.partsRequired as any) ?? undefined,
          partsSourcedFrom: dto.partsSourcedFrom,
          laborDescription: dto.laborDescription,
          timeSpent: dto.timeSpent,
          warrantyStatus: dto.warrantyStatus,
          estimatedCost: dto.estimatedCost,
          approvedByCustomer: dto.approvedByCustomer ?? false,
          approvalMethod: dto.approvalMethod,
          partsCost: dto.partsCost,
          laborCost: dto.laborCost,
          tax: dto.tax,
          discount: dto.discount,
          totalAmount: dto.totalAmount,
          paymentStatus: dto.paymentStatus || "UNPAID",
          paymentMethod: dto.paymentMethod,
          advanceDeposit: dto.advanceDeposit,
          internalNotes: dto.internalNotes,
          attachments: (dto.attachments as any) ?? undefined,
          photos: dto.photos ?? undefined,
        } as any
      });

      // Link uploaded attachments to this ticket entity
      if (dto.attachmentIds && Array.isArray(dto.attachmentIds) && dto.attachmentIds.length > 0) {
        await (tx as any).attachment.updateMany({
          where: {
            id: { in: dto.attachmentIds },
            tenantId: dto.tenantId!,
          },
          data: {
            entityId: newTicket.id,
          },
        });
      }

      // Increment usage count if it resolved to a Tenant Catalog Item
      if (resolved.tenantCatalogItemId) {
        await catalogService.incrementUsageTx(tx, resolved.tenantCatalogItemId);
      }

      return newTicket;
    });

    if (dto.advanceAmount && dto.advanceAmount > 0) {
      await paymentService.createPayment(
        ticket.id,
        {
          amount: dto.advanceAmount,
          type: "ADVANCE",
          method: dto.paymentMethod,
          notes: dto.advanceNotes,
        },
        dto.tenantId,
        recordedById
      );
    }

    const fullTicket = await ticketRepository.findById(ticket.id);
    if (!fullTicket) throw new NotFoundError("Ticket not found");
    const enriched = enrichTicketWithPaymentSummary(fullTicket);

    // Emit real-time WebSocket event
    emitTicketAssigned(enriched);

    return enriched;
  },

  updateTicket: async (id: string, dto: UpdateTicketDto, tenantId?: string, actorRole?: string, actorId?: string) => {
    // ------------------------------------------------------------------
    // Build an explicit update allow-list.
    // Ownership fields (tenantId, customerId, jobNumber) are NEVER updated
    // through normal CRUD to prevent cross-tenant record reassignment.
    // ------------------------------------------------------------------

    /**
     * Technician-safe fields only — all financial, invoice, payment, and
     * completion-status fields are excluded so they cannot be altered even
     * if the controller's guard is bypassed or future routes change.
     */
    const TECHNICIAN_FIELDS: (keyof UpdateTicketDto)[] = [
      "techDiagnosis", "diagnosisNotes", "rootCause",
      "partsRequired", "partsSourcedFrom", "laborDescription", "timeSpent",
      "itemCondition", "accessories", "reportedIssue",
      "internalNotes", "attachments", "photos",
      "estimatedCompletionDate",
    ];

    if (actorRole === "TECHNICIAN" && dto.status && (dto.status === "READY_FOR_PICKUP" || dto.status === "COMPLETED")) {
      throw new ForbiddenError("Technicians cannot set ticket status to READY_FOR_PICKUP or COMPLETED. Requires Advisor or Admin approval.");
    }

    const allowedFields = actorRole === "TECHNICIAN" ? TECHNICIAN_FIELDS : ALL_UPDATE_FIELDS;

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in dto) {
        data[field] = (dto as any)[field];
      }
    }

    // Parse date strings → Date objects.
    // IMPORTANT: check `data` (post-allow-list), not `dto`, so technicians
    // cannot sneak restricted date fields past the TECHNICIAN_FIELDS filter.
    if ("estimatedCompletionDate" in data && dto.estimatedCompletionDate)
      data.estimatedCompletionDate = new Date(dto.estimatedCompletionDate);
    if ("actualCompletionDate" in data && dto.actualCompletionDate)
      data.actualCompletionDate = new Date(dto.actualCompletionDate);
    if ("pickupDate" in data && dto.pickupDate)
      data.pickupDate = new Date(dto.pickupDate);
    if ("followUpDate" in data && dto.followUpDate)
      data.followUpDate = new Date(dto.followUpDate);

    // If reassigning, ensure the new assignee belongs to the same tenant and is within capacity
    if (dto.assignedToId && tenantId) {
      await assertAssigneeCapacity(dto.assignedToId, tenantId, id);
    }

    // Resolve catalog item updates and update usage counts inside transaction
    return prisma.$transaction(async (tx) => {
      const existing = await tx.ticket.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError("Ticket not found");

      const hasCatalogUpdate = "model" in data || "itemCategory" in data || "brand" in data;
      if (hasCatalogUpdate) {
        const newModel = "model" in data ? (data.model as string) : (existing.model || "");
        const newCategory = "itemCategory" in data ? (data.itemCategory as string) : (existing.itemCategory || "");
        const newBrand = "brand" in data ? (data.brand as string) : (existing.brand || "");

        const resolved = await catalogService.resolveCatalogItemTx(
          tx,
          newModel,
          newCategory,
          newBrand,
          existing.tenantId
        );

        data.model = resolved.resolvedModel;
        data.brand = resolved.resolvedBrand;
        data.itemCategory = resolved.resolvedCategory;
        data.globalCatalogItemId = resolved.globalCatalogItemId;
        data.tenantCatalogItemId = resolved.tenantCatalogItemId;

        // Decrement old tenant catalog item if it changes
        if (existing.tenantCatalogItemId && existing.tenantCatalogItemId !== resolved.tenantCatalogItemId) {
          await catalogService.decrementUsageTx(tx, existing.tenantCatalogItemId);
        }

        // Increment new tenant catalog item if it changes
        if (resolved.tenantCatalogItemId && existing.tenantCatalogItemId !== resolved.tenantCatalogItemId) {
          await catalogService.incrementUsageTx(tx, resolved.tenantCatalogItemId);
        }
      }

      // State machine validations & atomic status history recording
      if (data.status) {
        const from = existing.status as string;
        const to   = data.status as string;

        if (from !== to) {
          await tx.ticketStatusHistory.create({
            data: {
              ticketId: id,
              status: to as any,
              customerNote: (data.customerNote as string) || (dto as any).customerNote || undefined,
              createdById: actorId,
            },
          });
        }

        // When a ticket is CANCELLED, return all inventory-linked parts to stock.
        // This prevents inventory from being permanently deducted for repairs that never happened.
        if (to === "CANCELLED" && from !== "CANCELLED") {
          await stockMovementService.returnAllForTicket(tx, {
            tenantId:        existing.tenantId,
            ticketId:        id,
            ticketReference: existing.ticketNumber || existing.jobNumber || undefined,
            cancelledById:   actorId,
          });
        }
      }

      const updated = await tx.ticket.update({
        where: { id },
        data,
      });

      // Emit real-time WebSocket event
      emitTicketAssigned(updated);

      return updated;
    });
  },



  deleteTicket: async (id: string) => {
    // Guard: prevent deletion if the ticket has any payment records.
    // Deleting a ticket with payments would destroy the financial audit trail.
    const paymentCount = await prisma.payment.count({
      where: { ticketId: id },
    });

    if (paymentCount > 0) {
      throw new ValidationError(
        `Cannot delete this ticket — it has ${paymentCount} payment record(s) associated with it. ` +
        `Please void or refund all payments before deleting the ticket.`
      );
    }

    return ticketRepository.delete(id);
  },

  generateAttachmentPresign: async (
    tenantId: string,
    ticketId: string,
    contentType: string,
    fileType: "photo" | "video"
  ) => {
    return generateTicketAttachmentPresign(tenantId, ticketId, contentType, fileType);
  },
};
