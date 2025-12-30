-- CreateTable
CREATE TABLE "StationaryCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StationaryCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryVendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vendorCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "paymentTerms" TEXT,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "rating" INTEGER DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StationaryItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'pieces',
    "uomConversion" TEXT,
    "minStockLevel" INTEGER NOT NULL DEFAULT 0,
    "maxStockLevel" INTEGER,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "reorderQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL,
    "defaultVendorId" INTEGER,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "expiryTracking" BOOLEAN NOT NULL DEFAULT false,
    "barcodeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "barcode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" INTEGER NOT NULL,
    CONSTRAINT "StationaryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "StationaryCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StationaryItem_defaultVendorId_fkey" FOREIGN KEY ("defaultVendorId") REFERENCES "StationaryVendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StationaryItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryLocation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'warehouse',
    "departmentId" INTEGER,
    "address" TEXT,
    "capacity" TEXT,
    "managedById" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryLocation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StationaryLocation_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "batchNumber" TEXT,
    "expiryDate" DATETIME,
    "unitCost" DECIMAL,
    "totalValue" DECIMAL,
    "lastStocktakeDate" DATETIME,
    "lastStocktakeQuantity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryStock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StationaryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StationaryStock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StationaryLocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryRequisition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requisitionNo" TEXT NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "purpose" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedByL1Id" INTEGER,
    "approvedByL1At" DATETIME,
    "approvedByL2Id" INTEGER,
    "approvedByL2At" DATETIME,
    "rejectedById" INTEGER,
    "rejectedAt" DATETIME,
    "rejectionReason" TEXT,
    "issuedById" INTEGER,
    "issuedAt" DATETIME,
    "completedAt" DATETIME,
    "totalEstimatedCost" DECIMAL,
    "totalActualCost" DECIMAL,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryRequisition_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StationaryRequisition_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StationaryRequisition_approvedByL1Id_fkey" FOREIGN KEY ("approvedByL1Id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StationaryRequisition_approvedByL2Id_fkey" FOREIGN KEY ("approvedByL2Id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StationaryRequisition_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StationaryRequisition_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryRequisitionItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requisitionId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantityRequested" INTEGER NOT NULL,
    "quantityApproved" INTEGER,
    "quantityIssued" INTEGER NOT NULL DEFAULT 0,
    "estimatedUnitCost" DECIMAL,
    "estimatedTotal" DECIMAL,
    "justification" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryRequisitionItem_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "StationaryRequisition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StationaryRequisitionItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StationaryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryIssue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "issueNo" TEXT NOT NULL,
    "requisitionId" INTEGER,
    "issuedById" INTEGER NOT NULL,
    "issuedToId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'collection',
    "deliveryDate" DATETIME,
    "deliveryNotes" TEXT,
    "acknowledgedById" INTEGER,
    "acknowledgedAt" DATETIME,
    "totalCost" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryIssue_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "StationaryRequisition" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StationaryIssue_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StationaryIssue_issuedToId_fkey" FOREIGN KEY ("issuedToId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StationaryIssue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StationaryIssue_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StationaryLocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StationaryIssue_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryIssueItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "issueId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL,
    "totalCost" DECIMAL,
    "batchNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryIssueItem_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "StationaryIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StationaryIssueItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StationaryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryReturn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "returnNo" TEXT NOT NULL,
    "returnedById" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "returnType" TEXT NOT NULL DEFAULT 'unused',
    "returnReason" TEXT,
    "approvedById" INTEGER,
    "approvedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryReturn_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StationaryReturn_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StationaryReturn_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryReturnItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "returnId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "StationaryReturn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StationaryReturnItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StationaryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryPurchaseOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "poNumber" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" DECIMAL NOT NULL,
    "tax" DECIMAL,
    "shippingCost" DECIMAL,
    "totalAmount" DECIMAL NOT NULL,
    "approvedById" INTEGER,
    "approvedAt" DATETIME,
    "receivedById" INTEGER,
    "receivedAt" DATETIME,
    "createdById" INTEGER NOT NULL,
    "notes" TEXT,
    "termsConditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryPurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "StationaryVendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StationaryPurchaseOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StationaryPurchaseOrder_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StationaryPurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationaryPurchaseOrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchaseOrderId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantityOrdered" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL NOT NULL,
    "totalPrice" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationaryPurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "StationaryPurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StationaryPurchaseOrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StationaryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DepartmentBudget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departmentId" INTEGER NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "fiscalQuarter" INTEGER,
    "fiscalMonth" INTEGER,
    "allocatedAmount" DECIMAL NOT NULL,
    "spentAmount" DECIMAL NOT NULL DEFAULT 0,
    "committedAmount" DECIMAL NOT NULL DEFAULT 0,
    "availableAmount" DECIMAL NOT NULL DEFAULT 0,
    "alertThreshold" INTEGER NOT NULL DEFAULT 80,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DepartmentBudget_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StationaryCategory_code_key" ON "StationaryCategory"("code");

-- CreateIndex
CREATE INDEX "StationaryCategory_parentId_idx" ON "StationaryCategory"("parentId");

-- CreateIndex
CREATE INDEX "StationaryCategory_code_idx" ON "StationaryCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StationaryVendor_vendorCode_key" ON "StationaryVendor"("vendorCode");

-- CreateIndex
CREATE INDEX "StationaryVendor_vendorCode_idx" ON "StationaryVendor"("vendorCode");

-- CreateIndex
CREATE UNIQUE INDEX "StationaryItem_itemCode_key" ON "StationaryItem"("itemCode");

-- CreateIndex
CREATE UNIQUE INDEX "StationaryItem_barcode_key" ON "StationaryItem"("barcode");

-- CreateIndex
CREATE INDEX "StationaryItem_categoryId_idx" ON "StationaryItem"("categoryId");

-- CreateIndex
CREATE INDEX "StationaryItem_itemCode_idx" ON "StationaryItem"("itemCode");

-- CreateIndex
CREATE INDEX "StationaryItem_defaultVendorId_idx" ON "StationaryItem"("defaultVendorId");

-- CreateIndex
CREATE INDEX "StationaryItem_createdById_idx" ON "StationaryItem"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "StationaryLocation_code_key" ON "StationaryLocation"("code");

-- CreateIndex
CREATE INDEX "StationaryLocation_departmentId_idx" ON "StationaryLocation"("departmentId");

-- CreateIndex
CREATE INDEX "StationaryLocation_managedById_idx" ON "StationaryLocation"("managedById");

-- CreateIndex
CREATE INDEX "StationaryStock_itemId_idx" ON "StationaryStock"("itemId");

-- CreateIndex
CREATE INDEX "StationaryStock_locationId_idx" ON "StationaryStock"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "StationaryStock_itemId_locationId_batchNumber_key" ON "StationaryStock"("itemId", "locationId", "batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StationaryRequisition_requisitionNo_key" ON "StationaryRequisition"("requisitionNo");

-- CreateIndex
CREATE INDEX "StationaryRequisition_requestedById_idx" ON "StationaryRequisition"("requestedById");

-- CreateIndex
CREATE INDEX "StationaryRequisition_departmentId_idx" ON "StationaryRequisition"("departmentId");

-- CreateIndex
CREATE INDEX "StationaryRequisition_status_idx" ON "StationaryRequisition"("status");

-- CreateIndex
CREATE INDEX "StationaryRequisition_createdAt_idx" ON "StationaryRequisition"("createdAt");

-- CreateIndex
CREATE INDEX "StationaryRequisition_approvedByL1Id_idx" ON "StationaryRequisition"("approvedByL1Id");

-- CreateIndex
CREATE INDEX "StationaryRequisition_approvedByL2Id_idx" ON "StationaryRequisition"("approvedByL2Id");

-- CreateIndex
CREATE INDEX "StationaryRequisitionItem_requisitionId_idx" ON "StationaryRequisitionItem"("requisitionId");

-- CreateIndex
CREATE INDEX "StationaryRequisitionItem_itemId_idx" ON "StationaryRequisitionItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "StationaryIssue_issueNo_key" ON "StationaryIssue"("issueNo");

-- CreateIndex
CREATE INDEX "StationaryIssue_requisitionId_idx" ON "StationaryIssue"("requisitionId");

-- CreateIndex
CREATE INDEX "StationaryIssue_issuedById_idx" ON "StationaryIssue"("issuedById");

-- CreateIndex
CREATE INDEX "StationaryIssue_issuedToId_idx" ON "StationaryIssue"("issuedToId");

-- CreateIndex
CREATE INDEX "StationaryIssue_departmentId_idx" ON "StationaryIssue"("departmentId");

-- CreateIndex
CREATE INDEX "StationaryIssue_locationId_idx" ON "StationaryIssue"("locationId");

-- CreateIndex
CREATE INDEX "StationaryIssue_createdAt_idx" ON "StationaryIssue"("createdAt");

-- CreateIndex
CREATE INDEX "StationaryIssueItem_issueId_idx" ON "StationaryIssueItem"("issueId");

-- CreateIndex
CREATE INDEX "StationaryIssueItem_itemId_idx" ON "StationaryIssueItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "StationaryReturn_returnNo_key" ON "StationaryReturn"("returnNo");

-- CreateIndex
CREATE INDEX "StationaryReturn_returnedById_idx" ON "StationaryReturn"("returnedById");

-- CreateIndex
CREATE INDEX "StationaryReturn_departmentId_idx" ON "StationaryReturn"("departmentId");

-- CreateIndex
CREATE INDEX "StationaryReturn_status_idx" ON "StationaryReturn"("status");

-- CreateIndex
CREATE INDEX "StationaryReturn_createdAt_idx" ON "StationaryReturn"("createdAt");

-- CreateIndex
CREATE INDEX "StationaryReturnItem_returnId_idx" ON "StationaryReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "StationaryReturnItem_itemId_idx" ON "StationaryReturnItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "StationaryPurchaseOrder_poNumber_key" ON "StationaryPurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "StationaryPurchaseOrder_vendorId_idx" ON "StationaryPurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "StationaryPurchaseOrder_status_idx" ON "StationaryPurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "StationaryPurchaseOrder_createdById_idx" ON "StationaryPurchaseOrder"("createdById");

-- CreateIndex
CREATE INDEX "StationaryPurchaseOrder_approvedById_idx" ON "StationaryPurchaseOrder"("approvedById");

-- CreateIndex
CREATE INDEX "StationaryPurchaseOrderItem_purchaseOrderId_idx" ON "StationaryPurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "StationaryPurchaseOrderItem_itemId_idx" ON "StationaryPurchaseOrderItem"("itemId");

-- CreateIndex
CREATE INDEX "DepartmentBudget_departmentId_idx" ON "DepartmentBudget"("departmentId");

-- CreateIndex
CREATE INDEX "DepartmentBudget_fiscalYear_idx" ON "DepartmentBudget"("fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentBudget_departmentId_fiscalYear_fiscalQuarter_fiscalMonth_key" ON "DepartmentBudget"("departmentId", "fiscalYear", "fiscalQuarter", "fiscalMonth");
