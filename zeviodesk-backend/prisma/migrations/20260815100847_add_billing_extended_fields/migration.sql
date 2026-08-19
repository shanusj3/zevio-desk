-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "finalizedAt" TIMESTAMP(3),
ADD COLUMN     "finalizedById" TEXT,
ADD COLUMN     "lineItemsSnapshot" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3),
ADD COLUMN     "voidedById" TEXT,
ALTER COLUMN "invoiceNumber" DROP NOT NULL,
ALTER COLUMN "subtotal" SET DEFAULT 0,
ALTER COLUMN "discount" SET DEFAULT 0,
ALTER COLUMN "taxableAmount" SET DEFAULT 0,
ALTER COLUMN "tax" SET DEFAULT 0,
ALTER COLUMN "total" SET DEFAULT 0,
ALTER COLUMN "amountPaid" SET DEFAULT 0,
ALTER COLUMN "balanceDue" SET DEFAULT 0,
ALTER COLUMN "dueDate" DROP NOT NULL,
ALTER COLUMN "dueDate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ticket_line_items" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE INDEX "invoices_tenantId_idx" ON "invoices"("tenantId");

-- CreateIndex
CREATE INDEX "ticket_line_items_tenantId_idx" ON "ticket_line_items"("tenantId");
