import { prisma } from "../../config/prisma.js";
import { NotFoundError, ValidationError } from "../../errors/AppError.js";
import { StockMovementType } from "@prisma/client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CreateInventoryItemDto {
  name: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  category?: string;
  description?: string;
  costPrice?: number;
  sellingPrice: number;
  currentStock?: number;
  minimumStock?: number;
  location?: string;
}

export interface UpdateInventoryItemDto extends Partial<Omit<CreateInventoryItemDto, 'name' | 'sellingPrice'>> {
  name?: string;
  sellingPrice?: number;
}

export interface AdjustStockDto {
  quantity: number;   // positive = add, negative = remove
  reason?: string;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

async function requireItem(tenantId: string, itemId: string) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, tenantId },
  });
  if (!item) throw new NotFoundError("Inventory item not found");
  return item;
}

// ─── Inventory Service ─────────────────────────────────────────────────────────

export const inventoryService = {
  /**
   * List all inventory items for a tenant, with optional search / filter.
   */
  list: async (tenantId: string, opts?: {
    search?: string;
    category?: string;
    lowStockOnly?: boolean;
    includeInactive?: boolean;
    skip?: number;
    take?: number;
  }) => {
    const { search, category, lowStockOnly, includeInactive, skip = 0, take = 50 } = opts ?? {};

    const where: any = {
      tenantId,
      ...(includeInactive ? {} : { isActive: true }),
      ...(category ? { category } : {}),
      NOT: { name: { startsWith: "Unassigned Item (" } },
    };

    if (search) {
      where.OR = [
        { name:     { contains: search, mode: "insensitive" } },
        { sku:      { contains: search, mode: "insensitive" } },
        { brand:    { contains: search, mode: "insensitive" } },
        { barcode:  { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Post-filter for low stock (currentStock <= minimumStock)
    const result = lowStockOnly
      ? items.filter((i) => i.currentStock <= i.minimumStock)
      : items;

    return { items: result, total };
  },

  /**
   * Search inventory items for the part-search combobox (fast, lightweight).
   */
  search: async (tenantId: string, query: string, category?: string, limit = 12) => {
    const q = query.trim();
    const whereCondition: any = {
      tenantId,
      isActive: true,
    };
    if (category && category.trim()) {
      whereCondition.category = category.trim();
    }
    if (q) {
      whereCondition.OR = [
        { name:     { contains: q, mode: "insensitive" } },
        { sku:      { contains: q, mode: "insensitive" } },
        { brand:    { contains: q, mode: "insensitive" } },
        { barcode:  { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ];
    }
    return prisma.inventoryItem.findMany({
      where: whereCondition,
      orderBy: { name: "asc" },
      take: limit,
      select: {
        id:           true,
        name:         true,
        sku:          true,
        brand:        true,
        category:     true,
        description:  true,
        costPrice:    true,
        sellingPrice: true,
        currentStock: true,
        minimumStock: true,
        isActive:     true,
      },
    });
  },

  /**
   * Get a single item with its recent movement history.
   */
  getOne: async (tenantId: string, itemId: string) => {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, tenantId },
      include: {
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    if (!item) throw new NotFoundError("Inventory item not found");
    return item;
  },

  /**
   * Create a new inventory item.
   */
  create: async (tenantId: string, dto: CreateInventoryItemDto) => {
    if (!dto.name?.trim()) throw new ValidationError("Part name is required");
    if (!dto.sellingPrice || dto.sellingPrice < 0) throw new ValidationError("Selling price is required");

    return prisma.inventoryItem.create({
      data: {
        tenantId,
        name:         dto.name.trim(),
        sku:          dto.sku?.trim() || null,
        barcode:      dto.barcode?.trim() || null,
        brand:        dto.brand?.trim() || null,
        category:     dto.category?.trim() || null,
        description:  dto.description?.trim() || null,
        costPrice:    dto.costPrice ?? null,
        sellingPrice: dto.sellingPrice,
        currentStock: dto.currentStock ?? 0,
        minimumStock: dto.minimumStock ?? 0,
        location:     dto.location?.trim() || null,
      },
    });
  },

  /**
   * Update an existing inventory item's details (not stock — use adjustStock).
   */
  update: async (tenantId: string, itemId: string, dto: UpdateInventoryItemDto) => {
    await requireItem(tenantId, itemId);
    const data: any = {};
    if (dto.name         !== undefined) data.name         = dto.name.trim();
    if (dto.sku          !== undefined) data.sku          = dto.sku?.trim() || null;
    if (dto.barcode      !== undefined) data.barcode      = dto.barcode?.trim() || null;
    if (dto.brand        !== undefined) data.brand        = dto.brand?.trim() || null;
    if (dto.category     !== undefined) data.category     = dto.category?.trim() || null;
    if (dto.description  !== undefined) data.description  = dto.description?.trim() || null;
    if (dto.costPrice    !== undefined) data.costPrice    = dto.costPrice;
    if (dto.sellingPrice !== undefined) data.sellingPrice = dto.sellingPrice;
    if (dto.minimumStock !== undefined) data.minimumStock = dto.minimumStock;
    if (dto.location     !== undefined) data.location     = dto.location?.trim() || null;

    return prisma.inventoryItem.update({ where: { id: itemId }, data });
  },

  /**
   * Soft-delete an item by marking isActive = false.
   * Does not delete historical stock movements.
   */
  deactivate: async (tenantId: string, itemId: string) => {
    await requireItem(tenantId, itemId);
    return prisma.inventoryItem.update({
      where: { id: itemId },
      data:  { isActive: false },
    });
  },

  /**
   * Manual stock adjustment (STOCK_IN, ADJUSTMENT, etc.).
   * This is the only place besides stockMovementService that may mutate currentStock.
   */
  adjustStock: async (
    tenantId: string,
    itemId: string,
    dto: AdjustStockDto,
    userId?: string
  ) => {
    if (dto.quantity === 0) throw new ValidationError("Quantity delta must not be zero");

    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({ where: { id: itemId, tenantId } });
      if (!item) throw new NotFoundError("Inventory item not found");

      const previousStock = item.currentStock;
      const newStock = previousStock + dto.quantity;
      const movementType: StockMovementType =
        dto.quantity > 0 ? "STOCK_IN" : "ADJUSTMENT";

      await tx.inventoryItem.update({
        where: { id: itemId },
        data:  { currentStock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          inventoryItemId: itemId,
          type:         movementType,
          quantity:     dto.quantity,
          previousStock,
          newStock,
          reason:       dto.reason || null,
          createdById:  userId || null,
        },
      });

      return { previousStock, newStock, delta: dto.quantity };
    });
  },

  /**
   * Get paginated stock movement history for an item.
   */
  getMovements: async (tenantId: string, itemId: string, skip = 0, take = 30) => {
    await requireItem(tenantId, itemId);
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { tenantId, inventoryItemId: itemId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.stockMovement.count({ where: { tenantId, inventoryItemId: itemId } }),
    ]);
    return { movements, total };
  },

  /**
   * Toggle the tenant's inventory feature on/off.
   * Data is never deleted when disabled.
   */
  setEnabled: async (tenantId: string, enabled: boolean) => {
    return prisma.tenant.update({
      where: { id: tenantId },
      data:  { inventoryEnabled: enabled },
      select: { inventoryEnabled: true },
    });
  },

  /**
   * Get categories used by this tenant's inventory (for filter dropdown).
   */
  getCategories: async (tenantId: string) => {
    const items = await prisma.inventoryItem.findMany({
      where:  { tenantId, isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    });
    return items.map((i) => i.category).filter(Boolean) as string[];
  },

  /**
   * Delete a category and reassign all inventory items in this category to "All Products".
   */
  deleteCategory: async (tenantId: string, categoryName: string) => {
    return prisma.inventoryItem.updateMany({
      where: { tenantId, category: categoryName },
      data:  { category: "All Products" },
    });
  },

  /**
   * Create a new category by inserting a placeholder item if none exists.
   */
  createCategory: async (tenantId: string, categoryName: string) => {
    const existing = await prisma.inventoryItem.findFirst({
      where: { tenantId, category: categoryName },
    });
    if (!existing) {
      return prisma.inventoryItem.create({
        data: {
          tenantId,
          name: `Unassigned Item (${categoryName})`,
          category: categoryName,
          sellingPrice: 0,
          costPrice: 0,
          currentStock: 0,
          minimumStock: 0,
        },
      });
    }
    return existing;
  },

  /**
   * Rename a category across all inventory items for this tenant.
   */
  renameCategory: async (tenantId: string, oldName: string, newName: string) => {
    return prisma.inventoryItem.updateMany({
      where: { tenantId, category: oldName },
      data:  { category: newName },
    });
  },
};
