import { Request, Response } from "express";
import { webhookService } from "../services/webhook.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ValidationError, UnauthorizedError } from "../../../errors/AppError.js";
import { logger } from "../../../config/logger.js";

// Extend Request type to include rawBody
interface SignatureRequest extends Request {
  rawBody?: Buffer;
}

export const whatsappWebhookController = {
  /**
   * Verify challenge query parameter from Meta
   */
  verify: asyncHandler(async (req: Request, res: Response) => {
    logger.info("WhatsApp webhook challenge received");
    const challenge = webhookService.verifyChallenge(req.query);
    return res.status(200).send(challenge);
  }),

  /**
   * Process webhook POST message delivery events
   */
  handle: asyncHandler(async (req: SignatureRequest, res: Response) => {
    const signatureHeader = req.headers["x-hub-signature-256"] as string;

    // Verify Meta Request Signature
    const isSignatureValid = webhookService.verifySignature(req.rawBody, signatureHeader);
    if (!isSignatureValid) {
      logger.warn("WhatsApp Webhook Signature validation failed");
      throw new UnauthorizedError("Invalid Webhook Signature Header");
    }

    // Process Payload
    const result = await webhookService.processWebhookPayload(req.body);
    logger.info(`WhatsApp Webhook processed. Success: ${result.processed}`);
    
    // Always return 200 OK rapidly to satisfy Meta Graph API webhook rules
    return res.status(200).json(result);
  })
};
