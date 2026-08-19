-- Tenant-safe business identifiers and customer tracking tokens.
ALTER TABLE "tickets" ADD COLUMN "ticketNumber" TEXT;
ALTER TABLE "tickets" ADD COLUMN "publicToken" TEXT;

-- Preserve legacy references for existing tickets; all newly created tickets
-- receive sequential TK- numbers through TicketCounter.
UPDATE "tickets" SET "ticketNumber" = "jobNumber" WHERE "ticketNumber" IS NULL;
UPDATE "tickets" SET "publicToken" = md5(random()::text || clock_timestamp()::text || "id") WHERE "publicToken" IS NULL;
ALTER TABLE "tickets" ALTER COLUMN "ticketNumber" SET NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "publicToken" SET NOT NULL;
CREATE UNIQUE INDEX "tickets_tenantId_ticketNumber_key" ON "tickets"("tenantId", "ticketNumber");
CREATE UNIQUE INDEX "tickets_publicToken_key" ON "tickets"("publicToken");

ALTER TABLE "invoices" ADD COLUMN "publicToken" TEXT;
UPDATE "invoices" SET "tenantId" = "tickets"."tenantId" FROM "tickets" WHERE "invoices"."ticketId" = "tickets"."id" AND "invoices"."tenantId" IS NULL;
UPDATE "invoices" SET "publicToken" = md5(random()::text || clock_timestamp()::text || "id") WHERE "publicToken" IS NULL;
ALTER TABLE "invoices" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "publicToken" SET NOT NULL;
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_invoiceNumber_key";
CREATE UNIQUE INDEX "invoices_tenantId_invoiceNumber_key" ON "invoices"("tenantId", "invoiceNumber");
CREATE UNIQUE INDEX "invoices_publicToken_key" ON "invoices"("publicToken");

CREATE TABLE "ticket_counters" (
  "tenantId" TEXT NOT NULL PRIMARY KEY,
  "ticketSequence" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ticket_counters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);
INSERT INTO "ticket_counters" ("tenantId", "ticketSequence")
SELECT "tenantId", COUNT(*)::INTEGER FROM "tickets" GROUP BY "tenantId";

CREATE TABLE "invoice_sequences" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "invoiceSequence" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoice_sequences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "invoice_sequences_tenantId_year_key" ON "invoice_sequences"("tenantId", "year");
INSERT INTO "invoice_sequences" ("id", "tenantId", "year", "invoiceSequence")
SELECT
  md5("tenantId" || ':' || substring("invoiceNumber" from '^INV-([0-9]{4})-')),
  "tenantId",
  substring("invoiceNumber" from '^INV-([0-9]{4})-')::INTEGER,
  MAX(substring("invoiceNumber" from '^INV-[0-9]{4}-([0-9]+)$')::INTEGER)
FROM "invoices"
WHERE "invoiceNumber" ~ '^INV-[0-9]{4}-[0-9]+$'
GROUP BY "tenantId", substring("invoiceNumber" from '^INV-([0-9]{4})-');
