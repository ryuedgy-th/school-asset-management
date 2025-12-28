-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "slaDeadline" DATETIME;
ALTER TABLE "Ticket" ADD COLUMN "slaStatus" TEXT;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FMAsset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "type" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "location" TEXT,
    "building" TEXT,
    "floor" TEXT,
    "room" TEXT,
    "purchaseDate" DATETIME,
    "installDate" DATETIME,
    "warrantyExpiry" DATETIME,
    "specifications" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "status" TEXT NOT NULL DEFAULT 'active',
    "requiresMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "parentAssetId" INTEGER,
    "purchaseCost" DECIMAL,
    "currentValue" DECIMAL,
    "images" TEXT,
    "qrCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" INTEGER,
    CONSTRAINT "FMAsset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FMAssetCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FMAsset_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "FMAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FMAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FMAsset" ("assetCode", "brand", "building", "categoryId", "condition", "createdAt", "createdById", "currentValue", "description", "floor", "id", "images", "installDate", "location", "model", "name", "parentAssetId", "purchaseCost", "purchaseDate", "qrCode", "requiresMaintenance", "room", "serialNumber", "specifications", "status", "type", "updatedAt", "warrantyExpiry") SELECT "assetCode", "brand", "building", "categoryId", "condition", "createdAt", "createdById", "currentValue", "description", "floor", "id", "images", "installDate", "location", "model", "name", "parentAssetId", "purchaseCost", "purchaseDate", "qrCode", "requiresMaintenance", "room", "serialNumber", "specifications", "status", "type", "updatedAt", "warrantyExpiry" FROM "FMAsset";
DROP TABLE "FMAsset";
ALTER TABLE "new_FMAsset" RENAME TO "FMAsset";
CREATE UNIQUE INDEX "FMAsset_assetCode_key" ON "FMAsset"("assetCode");
CREATE UNIQUE INDEX "FMAsset_qrCode_key" ON "FMAsset"("qrCode");
CREATE INDEX "FMAsset_categoryId_idx" ON "FMAsset"("categoryId");
CREATE INDEX "FMAsset_status_idx" ON "FMAsset"("status");
CREATE INDEX "FMAsset_location_idx" ON "FMAsset"("location");
CREATE TABLE "new_Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assignmentNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "itClosureSignature" TEXT,
    "closedById" INTEGER,
    "closureNotes" TEXT,
    "signatureToken" TEXT,
    "signatureTokenExpiry" DATETIME,
    "signedPdfPath" TEXT,
    CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("academicYear", "assignmentNumber", "closedAt", "closedById", "closureNotes", "createdAt", "id", "itClosureSignature", "signatureToken", "signatureTokenExpiry", "signedPdfPath", "status", "term", "userId") SELECT "academicYear", "assignmentNumber", "closedAt", "closedById", "closureNotes", "createdAt", "id", "itClosureSignature", "signatureToken", "signatureTokenExpiry", "signedPdfPath", "status", "term", "userId" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE UNIQUE INDEX "Assignment_assignmentNumber_key" ON "Assignment"("assignmentNumber");
CREATE UNIQUE INDEX "Assignment_signatureToken_key" ON "Assignment"("signatureToken");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "Ticket_slaStatus_idx" ON "Ticket"("slaStatus");

-- CreateIndex
CREATE INDEX "Ticket_slaDeadline_idx" ON "Ticket"("slaDeadline");
