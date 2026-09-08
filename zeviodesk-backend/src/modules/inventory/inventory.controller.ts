import { Response } from "express";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/AppError.js";
import { inventoryService } from "./inventory.service.js";
import { parsePagination } from "../../utils/pagination.js";

export const inventoryController = {
  /** GET /inventory?search=&category=&lowStockOnly=&includeInactive= */
  list: asyncHandler(async (req: CustomRequest, res: Response) => {
    const { search, category, lowStockOnly, includeInactive } = req.query as Record<string, string>;
    const { skip, take } = parsePagination(req.query) as any;
    const result = await inventoryService.list(req.tenantId!, {
      search,
      category,
      lowStockOnly:    lowStockOnly === "true",
      includeInactive: includeInactive === "true",
      skip:            skip ?? 0,
      take:            take ?? 50,
    });
    return sendSuccess(res, result, "Inventory items retrieved");
  }),

  /** GET /inventory/search?q=&category=&limit= */
  search: asyncHandler(async (req: CustomRequest, res: Response) => {
    const q        = (req.query.q as string) || "";
    const category = (req.query.category as string) || "";
    const limit    = parseInt(req.query.limit as string) || 12;
    const items    = await inventoryService.search(req.tenantId!, q, category, limit);
    return sendSuccess(res, items, "Inventory search results");
  }),

  /** GET /inventory/categories */
  categories: asyncHandler(async (req: CustomRequest, res: Response) => {
    const cats = await inventoryService.getCategories(req.tenantId!);
    return sendSuccess(res, cats, "Categories retrieved");
  }),

  /** POST /inventory/categories */
  createCategory: asyncHandler(async (req: CustomRequest, res: Response) => {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      throw new ValidationError("Category name is required");
    }
    await inventoryService.createCategory(req.tenantId!, name.trim());
    return sendSuccess(res, { name: name.trim() }, "Category created successfully", 201);
  }),

  /** PUT /inventory/categories/rename */
  renameCategory: asyncHandler(async (req: CustomRequest, res: Response) => {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      throw new ValidationError("Both oldName and newName are required");
    }
    await inventoryService.renameCategory(req.tenantId!, oldName.trim(), newName.trim());
    return sendSuccess(res, { oldName, newName }, "Category renamed successfully");
  }),

  /** DELETE /inventory/categories/:name */
  deleteCategory: asyncHandler(async (req: CustomRequest, res: Response) => {
    const categoryName = decodeURIComponent(req.params.name);
    await inventoryService.deleteCategory(req.tenantId!, categoryName);
    return sendSuccess(res, { category: categoryName }, "Category deleted and products reassigned to All Products");
  }),

  /** GET /inventory/:id */
  getOne: asyncHandler(async (req: CustomRequest, res: Response) => {
    const item = await inventoryService.getOne(req.tenantId!, req.params.id);
    return sendSuccess(res, item, "Inventory item retrieved");
  }),

  /** POST /inventory */
  create: asyncHandler(async (req: CustomRequest, res: Response) => {
    const item = await inventoryService.create(req.tenantId!, req.body);
    return sendSuccess(res, item, "Inventory item created", 201);
  }),

  /** PATCH /inventory/:id */
  update: asyncHandler(async (req: CustomRequest, res: Response) => {
    const item = await inventoryService.update(req.tenantId!, req.params.id, req.body);
    return sendSuccess(res, item, "Inventory item updated");
  }),

  /** DELETE /inventory/:id */
  deactivate: asyncHandler(async (req: CustomRequest, res: Response) => {
    await inventoryService.deactivate(req.tenantId!, req.params.id);
    return sendSuccess(res, { id: req.params.id }, "Inventory item deactivated");
  }),

  /** POST /inventory/:id/adjust */
  adjustStock: asyncHandler(async (req: CustomRequest, res: Response) => {
    const { quantity, reason } = req.body;
    if (quantity === undefined || quantity === null) {
      throw new ValidationError("quantity is required");
    }
    const result = await inventoryService.adjustStock(
      req.tenantId!,
      req.params.id,
      { quantity: Number(quantity), reason },
      req.user?.id
    );
    return sendSuccess(res, result, "Stock adjusted");
  }),

  /** GET /inventory/:id/movements?skip=&take= */
  getMovements: asyncHandler(async (req: CustomRequest, res: Response) => {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 30;
    const result = await inventoryService.getMovements(req.tenantId!, req.params.id, skip, take);
    return sendSuccess(res, result, "Stock movements retrieved");
  }),

  /** PATCH /inventory/settings */
  toggleEnabled: asyncHandler(async (req: CustomRequest, res: Response) => {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      throw new ValidationError("'enabled' must be a boolean");
    }
    const result = await inventoryService.setEnabled(req.tenantId!, enabled);
    return sendSuccess(res, result, `Inventory ${enabled ? "enabled" : "disabled"}`);
  }),
};
