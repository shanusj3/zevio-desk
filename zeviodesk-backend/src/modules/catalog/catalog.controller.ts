import { Response } from "express";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { catalogService } from "./catalog.service.js";
import { sendSuccess } from "../../utils/response.js";
import { parsePagination, buildPaginatedMeta } from "../../utils/pagination.js";
import { prisma } from "../../config/prisma.js";

export const catalogController = {
  search: asyncHandler(async (req: CustomRequest, res: Response) => {
    const query = (req.query.q as string || "").trim();
    const tenantId = req.tenantId; // Derived securely from auth middleware
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || "15", 10)));

    const results = await catalogService.searchCatalog(query, tenantId, limit);
    return sendSuccess(res, results, "Catalog search results");
  }),

  getItems: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId; // Derived securely from auth middleware
    const { page, limit, skip } = parsePagination(req.query as any);
    
    const search = req.query.search as string | undefined;
    const source = req.query.source as string | undefined; // "GLOBAL" | "TENANT"
    const itemType = req.query.itemType as string | undefined;
    const category = req.query.category as string | undefined;

    // 1. Query Global Catalog
    const globalWhere: any = { isActive: true };
    if (search) {
      globalWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { manufacturer: { contains: search, mode: "insensitive" } },
      ];
    }
    if (itemType) globalWhere.itemType = itemType;
    if (category) globalWhere.category = category;

    const globalItems = source === "TENANT" ? [] : await prisma.globalCatalogItem.findMany({
      where: globalWhere,
      orderBy: { name: "asc" }
    });

    // 2. Query Tenant Catalog
    let tenantItems: any[] = [];
    if (tenantId && source !== "GLOBAL") {
      const tenantWhere: any = { tenantId };
      if (search) {
        tenantWhere.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { manufacturer: { contains: search, mode: "insensitive" } },
        ];
      }
      if (itemType) tenantWhere.itemType = itemType;
      if (category) tenantWhere.category = category;

      tenantItems = await prisma.tenantCatalogItem.findMany({
        where: tenantWhere,
        orderBy: { name: "asc" }
      });
    }

    // 3. Merge results
    const mergedList = [
      ...tenantItems.map(item => ({
        id: item.id,
        name: item.name,
        manufacturer: item.manufacturer,
        itemType: item.itemType,
        category: item.category,
        source: "TENANT",
        usageCount: item.usageCount,
        createdAt: item.createdAt,
      })),
      ...globalItems.map(item => ({
        id: item.id,
        name: item.name,
        manufacturer: item.manufacturer,
        itemType: item.itemType,
        category: item.category,
        source: "GLOBAL",
        usageCount: null,
        createdAt: item.createdAt,
      }))
    ];

    // Sort by name ascending
    mergedList.sort((a, b) => a.name.localeCompare(b.name));

    // Page-slice
    const total = mergedList.length;
    const paginatedItems = mergedList.slice(skip, skip + limit);

    return sendSuccess(
      res, 
      paginatedItems, 
      "Visible catalog items retrieved successfully", 
      200, 
      buildPaginatedMeta(total, page, limit)
    );
  })
};
