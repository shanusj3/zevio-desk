import { Response } from "express";
import { userService } from "./user.service.js";
import { sendSuccess } from "../../utils/response.js";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ForbiddenError, NotFoundError } from "../../errors/AppError.js";

export const userController = {
  getAll: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId || (req.query.tenantId as string | undefined);
    const staffOnly = req.query.staffOnly === "true";
    const users = await userService.getUsers(tenantId, staffOnly);
    return sendSuccess(res, users, "Users retrieved successfully");
  }),

  getOne: asyncHandler(async (req: CustomRequest, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    if (!user) throw new NotFoundError("User");
    if (req.user?.role !== "SUPER_ADMIN" && user.tenantId !== req.tenantId) {
      throw new ForbiddenError();
    }
    return sendSuccess(res, user, "User retrieved");
  }),

  create: asyncHandler(async (req: CustomRequest, res: Response) => {
    const actorRole = req.user?.role ?? "";
    const user = await userService.createUser(
      {
        ...req.body,
        tenantId: req.tenantId || req.body.tenantId,
      },
      actorRole
    );
    return sendSuccess(res, user, "User created successfully", 201);
  }),

  update: asyncHandler(async (req: CustomRequest, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    if (!user) throw new NotFoundError("User");
    if (req.user?.role !== "SUPER_ADMIN" && user.tenantId !== req.tenantId) {
      throw new ForbiddenError();
    }
    const actorRole = req.user?.role ?? "";
    const updated = await userService.updateUser(req.params.id, req.body, actorRole, req.user?.id);
    return sendSuccess(res, updated, "User updated successfully");
  }),

  delete: asyncHandler(async (req: CustomRequest, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    if (!user) throw new NotFoundError("User");
    if (req.user?.role !== "SUPER_ADMIN" && user.tenantId !== req.tenantId) {
      throw new ForbiddenError();
    }
    const actorRole = req.user?.role ?? "";
    await userService.deleteUser(req.params.id, actorRole);
    return sendSuccess(res, { id: req.params.id }, "User deleted successfully");
  }),
};
