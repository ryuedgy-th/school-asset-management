/*
  Warnings:

  - You are about to drop the column `totalCost` on the `InventoryTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `unitCost` on the `InventoryTransaction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticketNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "itAssetId" INTEGER,
    "fmAssetId" INTEGER,
    "inspectionId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "reportedById" INTEGER NOT NULL,
    "affectedUserId" INTEGER,
    "assignedToId" INTEGER,
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" DATETIME,
    "resolvedAt" DATETIME,
    "closedAt" DATETIME,
    "resolution" TEXT,
    "resolutionNotes" TEXT,
    "slaDeadline" DATETIME,
    "slaStatus" TEXT,
    "actualCost" DECIMAL,
    "images" TEXT,
    "documents" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_itAssetId_fkey" FOREIGN KEY ("itAssetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_fmAssetId_fkey" FOREIGN KEY ("fmAssetId") REFERENCES "FMAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_affectedUserId_fkey" FOREIGN KEY ("affectedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("assignedAt", "assignedToId", "category", "closedAt", "createdAt", "description", "documents", "fmAssetId", "id", "images", "itAssetId", "priority", "reportedAt", "reportedById", "resolution", "resolutionNotes", "resolvedAt", "slaDeadline", "slaStatus", "status", "subCategory", "ticketNumber", "title", "type", "updatedAt") SELECT "assignedAt", "assignedToId", "category", "closedAt", "createdAt", "description", "documents", "fmAssetId", "id", "images", "itAssetId", "priority", "reportedAt", "reportedById", "resolution", "resolutionNotes", "resolvedAt", "slaDeadline", "slaStatus", "status", "subCategory", "ticketNumber", "title", "type", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");
CREATE UNIQUE INDEX "Ticket_inspectionId_key" ON "Ticket"("inspectionId");
CREATE INDEX "Ticket_itAssetId_idx" ON "Ticket"("itAssetId");
CREATE INDEX "Ticket_fmAssetId_idx" ON "Ticket"("fmAssetId");
CREATE INDEX "Ticket_inspectionId_idx" ON "Ticket"("inspectionId");
CREATE INDEX "Ticket_reportedById_idx" ON "Ticket"("reportedById");
CREATE INDEX "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");
CREATE INDEX "Ticket_affectedUserId_idx" ON "Ticket"("affectedUserId");
CREATE INDEX "Ticket_slaStatus_idx" ON "Ticket"("slaStatus");
CREATE INDEX "Ticket_slaDeadline_idx" ON "Ticket"("slaDeadline");
CREATE TABLE "new_InventoryTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sparePartId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "estimatedCost" DECIMAL,
    "actualCost" DECIMAL,
    "finalCost" DECIMAL,
    "stockAfter" INTEGER NOT NULL,
    "notes" TEXT,
    "performedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryTransaction" ("createdAt", "id", "notes", "performedById", "quantity", "referenceId", "referenceType", "sparePartId", "stockAfter", "type") SELECT "createdAt", "id", "notes", "performedById", "quantity", "referenceId", "referenceType", "sparePartId", "stockAfter", "type" FROM "InventoryTransaction";
DROP TABLE "InventoryTransaction";
ALTER TABLE "new_InventoryTransaction" RENAME TO "InventoryTransaction";
CREATE INDEX "InventoryTransaction_sparePartId_idx" ON "InventoryTransaction"("sparePartId");
CREATE INDEX "InventoryTransaction_createdAt_idx" ON "InventoryTransaction"("createdAt");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
