import { Response } from "express";
import { ticketService } from "./ticket.service.js";
import { sendSuccess } from "../../utils/response.js";
import { parsePagination, buildPaginatedMeta } from "../../utils/pagination.js";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ForbiddenError, ValidationError } from "../../errors/AppError.js";
import { assertTicketHasNoInvoice } from "../../services/billing.service.js";

export const ticketController = {
  readyForPickup: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await ticketService.getReadyForPickup(req.tenantId);
    return sendSuccess(res, data, "Ready for pickup tickets retrieved");
  }),

  deliver: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await ticketService.deliverTicket(req.params.id, req.tenantId);
    return sendSuccess(res, data, "Ticket marked as delivered");
  }),

  getAll: asyncHandler(async (req: CustomRequest, res: Response) => {
    const status = req.query.status as string | undefined;
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
      req.tenantId, status, assignedToId, startDate, endDate, role, statusIn, skip, limit
    );
    const debugInfo = { role, tenantId: req.tenantId, statusIn, assignedToId, dataLength: data.length, v2: true };
    return sendSuccess(res, data as any, "Tickets retrieved v2", 200, { ...(buildPaginatedMeta(total, page, limit)), debugInfo });
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

    // Workflow guard: only ADVISOR/MANAGER/ADMIN can finalize (COMPLETED status)
    if (req.user?.role === "TECHNICIAN" && req.body.status === "COMPLETED") {
      throw new ForbiddenError("Technicians cannot set a ticket to Completed. Only Advisors and Admins can finalize tickets.");
    }

    // Technicians cannot re-assign tickets to a different technician
    if (req.user?.role === "TECHNICIAN" && "assignedToId" in req.body) {
      throw new ForbiddenError("Technicians cannot reassign tickets. Contact an Advisor or Admin to change the assignment.");
    }

    // Ensure invoice generation only happens when ticket is READY_FOR_PICKUP
    if (
      req.body.status === "COMPLETED" &&
      ticket.status !== "READY_FOR_PICKUP" &&
      ticket.status !== "COMPLETED"
    ) {
      throw new ValidationError("Ticket must be READY_FOR_PICKUP before generating an invoice");
    }

    const actorRole = req.user?.role;
    const updated = await ticketService.updateTicket(req.params.id, req.body, req.tenantId, actorRole);
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
