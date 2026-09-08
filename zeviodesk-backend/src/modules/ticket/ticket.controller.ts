import { Response } from "express";
import { ticketService } from "./ticket.service.js";
import { sendSuccess } from "../../utils/response.js";
import { parsePagination, buildPaginatedMeta } from "../../utils/pagination.js";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ForbiddenError, ValidationError } from "../../errors/AppError.js";
import { assertTicketHasNoInvoice } from "../../services/billing.service.js";

export const ticketController = {
  repairCompleted: asyncHandler(async (req: CustomRequest, res: Response) => {
    if (req.user?.role === "TECHNICIAN") {
      throw new ForbiddenError("Technicians do not have access to the Repair Completed queue");
    }
    const data = await ticketService.getRepairCompleted(req.tenantId);
    return sendSuccess(res, data, "Repair completed tickets retrieved");
  }),

  readyForPickup: asyncHandler(async (req: CustomRequest, res: Response) => {
    if (req.user?.role === "TECHNICIAN") {
      throw new ForbiddenError("Technicians do not have access to the Ready for Pickup queue");
    }
    const data = await ticketService.getReadyForPickup(req.tenantId);
    return sendSuccess(res, data, "Ready for pickup tickets retrieved");
  }),

  completeRepair: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await ticketService.completeRepair(
      req.params.id,
      req.tenantId,
      req.user?.id,
      req.user?.role
    );
    return sendSuccess(res, data, "Repair completed successfully");
  }),

  deliver: asyncHandler(async (req: CustomRequest, res: Response) => {
    if (req.user?.role === "TECHNICIAN") {
      throw new ForbiddenError("Technicians cannot deliver tickets");
    }
    const data = await ticketService.deliverTicket(req.params.id, req.tenantId, req.user?.id);
    return sendSuccess(res, data, "Ticket marked as delivered");
  }),

  getAll: asyncHandler(async (req: CustomRequest, res: Response) => {
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const search = (req.query.search || req.query.q) as string | undefined;
    const role = req.user?.role;
    const assignedToId = role === "TECHNICIAN" ? req.user?.id : undefined;

    // Parse comma-separated statusIn e.g. ?statusIn=RECEIVED,DIAGNOSING
    const statusInRaw = req.query.statusIn as string | undefined;
    const statusIn = statusInRaw ? statusInRaw.split(",").map((s) => s.trim()) : undefined;

    // Parse date range from query: ?startDate=2024-01-01&endDate=2024-01-31
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    // Set end of day for endDate so the full day is included
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await ticketService.getTickets(
      req.tenantId,
      status,
      assignedToId,
      startDate,
      endDate,
      role,
      statusIn,
      skip,
      limit,
      search,
      priority
    );
    const debugInfo = { role, tenantId: req.tenantId, statusIn, assignedToId, dataLength: data.length, search, priority, total };
    return sendSuccess(res, data as any, "Tickets retrieved v2", 200, { ...(buildPaginatedMeta(total, page, limit)), total, debugInfo });
  }),

  getOne: asyncHandler(async (req: CustomRequest, res: Response) => {
    const ticket = await ticketService.getTicketByReference(req.params.id, req.tenantId);
    if (req.user?.role === "TECHNICIAN" && ticket.assignedToId !== req.user?.id) {
      throw new ForbiddenError("You can only view tickets assigned to you");
    }
    return sendSuccess(res, ticket, "Ticket details");
  }),

  create: asyncHandler(async (req: CustomRequest, res: Response) => {
    if (!req.tenantId) throw new ValidationError("Tenant context missing");
    const ticket = await ticketService.createTicket(
      {
        ...req.body,
        // The authenticated user's tenant is the only authorization source.
        tenantId: req.tenantId,
      },
      req.user?.id
    );
    return sendSuccess(res, ticket, "Ticket created", 201);
  }),

  update: asyncHandler(async (req: CustomRequest, res: Response) => {
    const ticket = await ticketService.getTicketById(req.params.id);
    if (req.user?.role !== "SUPER_ADMIN" && ticket.tenantId !== req.tenantId) {
      throw new ForbiddenError();
    }
    if (req.user?.role === "TECHNICIAN" && ticket.assignedToId !== req.user?.id) {
      throw new ForbiddenError("You can only update tickets assigned to you");
    }

    // Workflow guard: Technicians cannot directly advance to READY_FOR_PICKUP, DELIVERED, or COMPLETED.
    // They must use the "Complete Repair" action to transition to REPAIR_COMPLETED.
    if (
      req.user?.role === "TECHNICIAN" &&
      req.body.status &&
      ["READY_FOR_PICKUP", "DELIVERED", "COMPLETED"].includes(req.body.status)
    ) {
      throw new ForbiddenError(
        "Technicians cannot set ticket status to READY_FOR_PICKUP or DELIVERED. Please use 'Complete Repair' action instead."
      );
    }

    // Technicians cannot re-assign tickets to a different technician
    if (req.user?.role === "TECHNICIAN" && "assignedToId" in req.body) {
      throw new ForbiddenError("Technicians cannot reassign tickets. Contact an Advisor or Admin to change the assignment.");
    }



    const actorRole = req.user?.role;
    const updated = await ticketService.updateTicket(req.params.id, req.body, req.tenantId, actorRole, req.user?.id);
    return sendSuccess(res, updated, "Ticket updated");

  }),

  delete: asyncHandler(async (req: CustomRequest, res: Response) => {
    if (req.user?.role === "TECHNICIAN") {
      throw new ForbiddenError("Technicians cannot delete tickets");
    }
    const ticket = await ticketService.getTicketById(req.params.id);
    if (req.user?.role !== "SUPER_ADMIN" && ticket.tenantId !== req.tenantId) {
      throw new ForbiddenError();
    }
    // Block deletion of tickets that have an invoice (financial record must be preserved)
    await assertTicketHasNoInvoice(req.params.id);
    await ticketService.deleteTicket(req.params.id);
    return sendSuccess(res, { id: req.params.id }, "Ticket deleted");
  }),

  presignAttachment: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new ValidationError("Tenant ID is required");

    const { contentType, fileType } = req.body;
    if (!contentType || !fileType) {
      throw new ValidationError("contentType and fileType are required");
    }

    const ticketId = req.params.id;

    // Verify the ticket exists and belongs to the caller's tenant before
    // generating an S3 upload credential (P2: attachment presign ownership check)
    const ticket = await ticketService.getTicketById(ticketId);
    if (req.user?.role !== "SUPER_ADMIN" && ticket.tenantId !== tenantId) {
      throw new ForbiddenError();
    }

    const presigned = await ticketService.generateAttachmentPresign(
      tenantId,
      ticketId,
      contentType,
      fileType
    );
    return sendSuccess(res, presigned, "Presigned URL generated");
  }),
};
