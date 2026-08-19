-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "globalCatalogItemId" TEXT,
ADD COLUMN     "tenantCatalogItemId" TEXT;

-- CreateTable
CREATE TABLE "global_catalog_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "manufacturer" TEXT,
    "itemType" TEXT NOT NULL DEFAULT 'Device',
    "category" TEXT NOT NULL,
    "modelNumber" TEXT,
    "searchAliases" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_catalog_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "manufacturer" TEXT,
    "itemType" TEXT NOT NULL DEFAULT 'Device',
    "category" TEXT NOT NULL,
    "modelNumber" TEXT,
    "globalCatalogItemId" TEXT,
    "createdBy" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "firstUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "global_catalog_items_normalizedName_key" ON "global_catalog_items"("normalizedName");

-- CreateIndex
CREATE INDEX "tenant_catalog_items_tenantId_normalizedName_idx" ON "tenant_catalog_items"("tenantId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_catalog_items_tenantId_normalizedName_key" ON "tenant_catalog_items"("tenantId", "normalizedName");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_globalCatalogItemId_fkey" FOREIGN KEY ("globalCatalogItemId") REFERENCES "global_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenantCatalogItemId_fkey" FOREIGN KEY ("tenantCatalogItemId") REFERENCES "tenant_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_catalog_items" ADD CONSTRAINT "tenant_catalog_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_catalog_items" ADD CONSTRAINT "tenant_catalog_items_globalCatalogItemId_fkey" FOREIGN KEY ("globalCatalogItemId") REFERENCES "global_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
