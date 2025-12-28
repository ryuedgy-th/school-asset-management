-- CreateTable
CREATE TABLE "FMAssetCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FMAsset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "location" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "AssetComponent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    "description" TEXT,
    "serialNumber" TEXT,
    "partNumber" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "installDate" DATETIME,
    "installedBy" TEXT,
    "lastServiceDate" DATETIME,
    "nextServiceDue" DATETIME,
    "serviceInterval" INTEGER,
    "expectedLifespan" INTEGER,
    "replacementCost" DECIMAL,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssetComponent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FMAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComponentService" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "componentId" INTEGER NOT NULL,
    "serviceDate" DATETIME NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "cost" DECIMAL,
    "partsReplaced" TEXT,
    "nextServiceDue" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComponentService_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "AssetComponent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PMSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheduleType" TEXT NOT NULL,
    "frequency" TEXT,
    "intervalValue" INTEGER,
    "intervalUnit" TEXT,
    "usageMetric" TEXT,
    "usageInterval" INTEGER,
    "lastPerformed" DATETIME,
    "nextDueDate" DATETIME,
    "nextDueUsage" INTEGER,
    "checklistItems" TEXT,
    "autoCreateWO" BOOLEAN NOT NULL DEFAULT true,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedToId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PMSchedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FMAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PMSchedule_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticketNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "itAssetId" INTEGER,
    "fmAssetId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "reportedById" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" DATETIME,
    "resolvedAt" DATETIME,
    "closedAt" DATETIME,
    "resolution" TEXT,
    "resolutionNotes" TEXT,
    "images" TEXT,
    "documents" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_itAssetId_fkey" FOREIGN KEY ("itAssetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_fmAssetId_fkey" FOREIGN KEY ("fmAssetId") REFERENCES "FMAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TicketComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticketId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "images" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TicketActivity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticketId" INTEGER NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SparePart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "supplier" TEXT,
    "supplierPartNo" TEXT,
    "unitCost" DECIMAL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "maxStock" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "storageLocation" TEXT,
    "binLocation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ComponentSparePart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "componentId" INTEGER NOT NULL,
    "sparePartId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isRecommended" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    CONSTRAINT "ComponentSparePart_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "AssetComponent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComponentSparePart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sparePartId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "unitCost" DECIMAL,
    "totalCost" DECIMAL,
    "stockAfter" INTEGER NOT NULL,
    "notes" TEXT,
    "performedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "readings" TEXT,
    "cost" DECIMAL,
    "partsChanged" TEXT,
    "nextServiceDue" DATETIME,
    "images" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FMAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ACInspectionTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "checklistItems" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ACInspectionRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fmAssetId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "inspectionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectedById" INTEGER NOT NULL,
    "checklistResults" TEXT NOT NULL,
    "overallStatus" TEXT NOT NULL,
    "notes" TEXT,
    "images" TEXT,
    "nextInspectionDue" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ACInspectionRecord_fmAssetId_fkey" FOREIGN KEY ("fmAssetId") REFERENCES "FMAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ACInspectionRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ACInspectionTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ACInspectionRecord_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FMAssetCategory_name_key" ON "FMAssetCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FMAsset_assetCode_key" ON "FMAsset"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "FMAsset_qrCode_key" ON "FMAsset"("qrCode");

-- CreateIndex
CREATE INDEX "FMAsset_categoryId_idx" ON "FMAsset"("categoryId");

-- CreateIndex
CREATE INDEX "FMAsset_status_idx" ON "FMAsset"("status");

-- CreateIndex
CREATE INDEX "FMAsset_location_idx" ON "FMAsset"("location");

-- CreateIndex
CREATE INDEX "AssetComponent_assetId_idx" ON "AssetComponent"("assetId");

-- CreateIndex
CREATE INDEX "ComponentService_componentId_idx" ON "ComponentService"("componentId");

-- CreateIndex
CREATE INDEX "ComponentService_serviceDate_idx" ON "ComponentService"("serviceDate");

-- CreateIndex
CREATE INDEX "PMSchedule_assetId_idx" ON "PMSchedule"("assetId");

-- CreateIndex
CREATE INDEX "PMSchedule_nextDueDate_idx" ON "PMSchedule"("nextDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "Ticket_type_idx" ON "Ticket"("type");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");

-- CreateIndex
CREATE INDEX "Ticket_reportedById_idx" ON "Ticket"("reportedById");

-- CreateIndex
CREATE INDEX "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");

-- CreateIndex
CREATE INDEX "TicketActivity_ticketId_idx" ON "TicketActivity"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_partNumber_key" ON "SparePart"("partNumber");

-- CreateIndex
CREATE INDEX "SparePart_category_idx" ON "SparePart"("category");

-- CreateIndex
CREATE INDEX "SparePart_currentStock_idx" ON "SparePart"("currentStock");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentSparePart_componentId_sparePartId_key" ON "ComponentSparePart"("componentId", "sparePartId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_sparePartId_idx" ON "InventoryTransaction"("sparePartId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_createdAt_idx" ON "InventoryTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceLog_assetId_idx" ON "MaintenanceLog"("assetId");

-- CreateIndex
CREATE INDEX "MaintenanceLog_date_idx" ON "MaintenanceLog"("date");

-- CreateIndex
CREATE INDEX "ACInspectionRecord_fmAssetId_idx" ON "ACInspectionRecord"("fmAssetId");

-- CreateIndex
CREATE INDEX "ACInspectionRecord_inspectionDate_idx" ON "ACInspectionRecord"("inspectionDate");
