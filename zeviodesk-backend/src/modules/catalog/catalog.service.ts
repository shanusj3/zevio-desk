import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export const catalogService = {
  /**
   * Performs unified search over Global + Tenant catalogs, returning a merged list.
   * Derives tenantId securely from context.
   */
  async searchCatalog(query: string, tenantId?: string, limit = 15) {
    if (!query) return [];
    const normalized = query.trim().toLowerCase();

    // 1. Search Tenant catalog if tenantId is present
    let tenantItems: any[] = [];
    if (tenantId) {
      tenantItems = await prisma.tenantCatalogItem.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { manufacturer: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit,
      });
    }

    // 2. Search Global catalog
    const globalItems = await prisma.globalCatalogItem.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { manufacturer: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
    });

    // Merge and format results
    const results: any[] = [];
    const addedNormalizedNames = new Set<string>();

    // Add tenant items
    for (const item of tenantItems) {
      const norm = item.name.trim().toLowerCase();
      results.push({
        id: item.id,
        name: item.name,
        manufacturer: item.manufacturer,
        itemType: item.itemType,
        category: item.category,
        source: "TENANT",
        globalCatalogItemId: null,
        tenantCatalogItemId: item.id
      });
      addedNormalizedNames.add(norm);
    }

    // Add global items (prefer global on exact/duplicate matches)
    for (const item of globalItems) {
      const norm = item.name.trim().toLowerCase();
      
      const existingTenantIndex = results.findIndex(
        (r) => r.source === "TENANT" && r.name.trim().toLowerCase() === norm
      );

      if (existingTenantIndex !== -1) {
        // Replace tenant match with global match since global is preferred on duplicate exact name
        results[existingTenantIndex] = {
          id: item.id,
          name: item.name,
          manufacturer: item.manufacturer,
          itemType: item.itemType,
          category: item.category,
          source: "GLOBAL",
          globalCatalogItemId: item.id,
          tenantCatalogItemId: null
        };
      } else if (!addedNormalizedNames.has(norm)) {
        results.push({
          id: item.id,
          name: item.name,
          manufacturer: item.manufacturer,
          itemType: item.itemType,
          category: item.category,
          source: "GLOBAL",
          globalCatalogItemId: item.id,
          tenantCatalogItemId: null
        });
      }
    }

    // Rank results: exact name matches first
    results.sort((a, b) => {
      const aNorm = a.name.trim().toLowerCase();
      const bNorm = b.name.trim().toLowerCase();
      const aExact = aNorm === normalized;
      const bExact = bNorm === normalized;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Prefer Tenant over Global for partial matches if they aren't exact
      if (a.source === "TENANT" && b.source === "GLOBAL") return -1;
      if (a.source === "GLOBAL" && b.source === "TENANT") return 1;

      return 0;
    });

    return results.slice(0, limit);
  },

  /**
   * Resolves a catalog item inside a transaction.
   * If not found in Global or Tenant catalog, creates a new Tenant record.
   */
  async resolveCatalogItemTx(
    tx: Prisma.TransactionClient,
    modelName: string,
    itemCategory?: string,
    brand?: string,
    tenantId?: string,
    createdBy?: string
  ) {
    if (!modelName) {
      return {
        globalCatalogItemId: null,
        tenantCatalogItemId: null,
        resolvedModel: "",
        resolvedBrand: brand || null,
        resolvedCategory: itemCategory || ""
      };
    }

    const normalizedName = modelName.trim().toLowerCase();

    // 1. Check Global catalog first (exact match)
    const matchedGlobal = await tx.globalCatalogItem.findUnique({
      where: { normalizedName }
    });

    if (matchedGlobal) {
      return {
        globalCatalogItemId: matchedGlobal.id,
        tenantCatalogItemId: null,
        resolvedModel: matchedGlobal.name,
        resolvedBrand: matchedGlobal.manufacturer || brand || null,
        resolvedCategory: matchedGlobal.category
      };
    }

    // 2. Check Tenant catalog if tenantId is provided (exact match)
    if (tenantId) {
      const matchedTenant = await tx.tenantCatalogItem.findUnique({
        where: {
          tenantId_normalizedName: {
            tenantId,
            normalizedName
          }
        }
      });

      if (matchedTenant) {
        return {
          globalCatalogItemId: null,
          tenantCatalogItemId: matchedTenant.id,
          resolvedModel: matchedTenant.name,
          resolvedBrand: matchedTenant.manufacturer || brand || null,
          resolvedCategory: matchedTenant.category
        };
      }

      // 3. Unresolved: create a new Tenant catalog item dynamically!
      const resolvedCategory = itemCategory || "Other";
      
      // Determine ItemType based on category
      let resolvedItemType = "Device";
      const SPARE_PART_CATEGORIES = ["Display", "Battery", "Charging Port", "Motherboard", "Keyboard"];
      const ACCESSORY_CATEGORIES = ["Cable", "Charger", "Adapter", "Case"];
      const COMPONENT_CATEGORIES = ["PCB", "IC", "Connector", "Sensor"];
      const CONSUMABLE_CATEGORIES = ["Thermal Paste", "Solder", "Flux", "Glue", "Tape", "Cleaner"];

      if (SPARE_PART_CATEGORIES.includes(resolvedCategory)) {
        resolvedItemType = "Spare Part";
      } else if (ACCESSORY_CATEGORIES.includes(resolvedCategory)) {
        resolvedItemType = "Accessory";
      } else if (COMPONENT_CATEGORIES.includes(resolvedCategory)) {
        resolvedItemType = "Component";
      } else if (CONSUMABLE_CATEGORIES.includes(resolvedCategory)) {
        resolvedItemType = "Consumable";
      }

      // Guess brand if missing (e.g. first word of modelName)
      let resolvedBrand = (brand || "").trim();
      if (!resolvedBrand) {
        const firstWord = modelName.trim().split(" ")[0];
        resolvedBrand = firstWord || "Other";
      }

      const newTenantItem = await tx.tenantCatalogItem.create({
        data: {
          tenantId,
          name: modelName.trim(),
          normalizedName,
          manufacturer: resolvedBrand,
          itemType: resolvedItemType,
          category: resolvedCategory,
          createdBy: createdBy || null,
          usageCount: 0, // Will be incremented separately by the caller
        }
      });

      return {
        globalCatalogItemId: null,
        tenantCatalogItemId: newTenantItem.id,
        resolvedModel: newTenantItem.name,
        resolvedBrand: newTenantItem.manufacturer,
        resolvedCategory: newTenantItem.category
      };
    }

    return {
      globalCatalogItemId: null,
      tenantCatalogItemId: null,
      resolvedModel: modelName,
      resolvedBrand: brand || null,
      resolvedCategory: itemCategory || ""
    };
  },

  async incrementUsageTx(tx: Prisma.TransactionClient, tenantCatalogItemId: string) {
    await tx.tenantCatalogItem.update({
      where: { id: tenantCatalogItemId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    });
  },

  async decrementUsageTx(tx: Prisma.TransactionClient, tenantCatalogItemId: string) {
    const item = await tx.tenantCatalogItem.findUnique({
      where: { id: tenantCatalogItemId },
      select: { usageCount: true }
    });
    if (item && item.usageCount > 0) {
      await tx.tenantCatalogItem.update({
        where: { id: tenantCatalogItemId },
        data: {
          usageCount: { decrement: 1 }
        }
      });
    }
  }
};
