import { Response } from "express";
import { paymentService } from "./payment.service.js";
import { sendSuccess } from "../../utils/response.js";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ForbiddenError } from "../../errors/AppError.js";
import { ticketService } from "../ticket/ticket.service.js";

export const paymentController = {
  list: asyncHandler(async (req: CustomRequest, res: Response) => {
    // Technicians can only see payments for tickets assigned to them
    if (req.user?.role === "TECHNICIAN") {
      const ticket = await ticketService.getTicketById(req.params.ticketId);
      if (ticket.assignedToId !== req.user.id) {
        throw new ForbiddenError("You can only view payments for tickets assigned to you");
      }
    }
    const payments = await paymentService.listPayments(req.params.ticketId, req.tenantId);
    return sendSuccess(res, payments, "Payments retrieved successfully");
  }),

  create: asyncHandler(async (req: CustomRequest, res: Response) => {
    const payment = await paymentService.createPayment(
      req.params.ticketId,
      req.body,
      req.tenantId,
      req.user?.id
    );
    return sendSuccess(res, payment, "Payment recorded", 201);
  }),

  delete: asyncHandler(async (req: CustomRequest, res: Response) => {
    const result = await paymentService.deletePayment(
      req.params.ticketId,
      req.params.paymentId,
      req.tenantId
    );
    return sendSuccess(res, result, "Payment deleted");
  }),
};
