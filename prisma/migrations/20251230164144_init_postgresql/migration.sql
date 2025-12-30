-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "nickname" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "roleId" INTEGER,
    "departmentId" INTEGER,
    "phoneNumber" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAttempt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "icon" TEXT,
    "routePath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModulePermission" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ModulePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "scopeFilter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" INTEGER,
    "scope" TEXT NOT NULL DEFAULT 'department',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExp" TIMESTAMP(3),
    "vendor" TEXT,
    "cost" DECIMAL(65,30),
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "image" TEXT,
    "totalStock" INTEGER NOT NULL DEFAULT 1,
    "currentStock" INTEGER NOT NULL DEFAULT 1,
    "departmentId" INTEGER,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" SERIAL NOT NULL,
    "inspectionNumber" TEXT,
    "assetId" INTEGER NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectionType" TEXT NOT NULL,
    "inspectorId" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "assignmentId" INTEGER,
    "exteriorCondition" TEXT,
    "exteriorNotes" TEXT,
    "screenCondition" TEXT,
    "screenNotes" TEXT,
    "buttonPortCondition" TEXT,
    "buttonPortNotes" TEXT,
    "keyboardCondition" TEXT,
    "keyboardNotes" TEXT,
    "touchpadCondition" TEXT,
    "batteryHealth" TEXT,
    "overallCondition" TEXT NOT NULL,
    "damageFound" BOOLEAN NOT NULL DEFAULT false,
    "damageDescription" TEXT,
    "estimatedCost" DECIMAL(65,30) DEFAULT 0,
    "photoUrls" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "acknowledgementPdfGenerated" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgementPdfPath" TEXT,
    "damageStatus" TEXT DEFAULT 'pending_review',
    "damageSeverity" TEXT,
    "canContinueUse" BOOLEAN NOT NULL DEFAULT false,
    "repairStatus" TEXT,
    "repairStartDate" TIMESTAMP(3),
    "repairCompletedDate" TIMESTAMP(3),
    "repairCost" DECIMAL(65,30),
    "repairNotes" TEXT,
    "repairedBy" TEXT,
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "approvalNotes" TEXT,
    "formSentAt" TIMESTAMP(3),
    "formSignedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueReport" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "reporterName" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "assignmentNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "itClosureSignature" TEXT,
    "closedById" INTEGER,
    "closureNotes" TEXT,
    "signatureToken" TEXT,
    "signatureTokenExpiry" TIMESTAMP(3),
    "signedPdfPath" TEXT,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowTransaction" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "borrowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" INTEGER,
    "cancelReason" TEXT,
    "borrowerSignature" TEXT,
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "signatureToken" TEXT,
    "signatureTokenExpiry" TIMESTAMP(3),
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signedPdfPath" TEXT,
    "signedPdfGeneratedAt" TIMESTAMP(3),

    CONSTRAINT "BorrowTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowItem" (
    "id" SERIAL NOT NULL,
    "borrowTransactionId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Borrowed',
    "checkoutInspectionId" INTEGER,

    CONSTRAINT "BorrowItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnTransaction" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedById" INTEGER NOT NULL,
    "checkerSignature" TEXT,
    "notes" TEXT,
    "checkinInspectionId" INTEGER,

    CONSTRAINT "ReturnTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" SERIAL NOT NULL,
    "returnTransactionId" INTEGER NOT NULL,
    "borrowItemId" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "damageNotes" TEXT,
    "damageCharge" DECIMAL(65,30) DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PMTask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "type" TEXT NOT NULL,
    "assetId" INTEGER,
    "assigneeId" INTEGER,
    "resultNotes" TEXT,
    "resultImage" TEXT,

    CONSTRAINT "PMTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "registrar" TEXT,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "sslStatus" TEXT,
    "sslExpiry" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "hostingProvider" TEXT,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" SERIAL NOT NULL,
    "softwareName" TEXT NOT NULL,
    "licenseKey" TEXT,
    "type" TEXT NOT NULL,
    "seatsTotal" INTEGER NOT NULL,
    "seatsUsed" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3),
    "cost" TEXT,
    "vendor" TEXT,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "value" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "filePath" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAccount" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "oauthClientId" TEXT,
    "oauthClientSecret" TEXT,
    "oauthRefreshToken" TEXT,
    "oauthAccessToken" TEXT,
    "oauthTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "emailAccountId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FMAssetCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FMAssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FMAsset" (
    "id" SERIAL NOT NULL,
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
    "purchaseDate" TIMESTAMP(3),
    "installDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "specifications" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "status" TEXT NOT NULL DEFAULT 'active',
    "requiresMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "parentAssetId" INTEGER,
    "purchaseCost" DECIMAL(65,30),
    "currentValue" DECIMAL(65,30),
    "images" TEXT,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,

    CONSTRAINT "FMAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetComponent" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    "description" TEXT,
    "serialNumber" TEXT,
    "partNumber" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "installDate" TIMESTAMP(3),
    "installedBy" TEXT,
    "lastServiceDate" TIMESTAMP(3),
    "nextServiceDue" TIMESTAMP(3),
    "serviceInterval" INTEGER,
    "expectedLifespan" INTEGER,
    "replacementCost" DECIMAL(65,30),
    "condition" TEXT NOT NULL DEFAULT 'good',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentService" (
    "id" SERIAL NOT NULL,
    "componentId" INTEGER NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "cost" DECIMAL(65,30),
    "partsReplaced" TEXT,
    "nextServiceDue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComponentService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PMSchedule" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "componentId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheduleType" TEXT NOT NULL,
    "frequency" TEXT,
    "intervalValue" INTEGER,
    "intervalUnit" TEXT,
    "usageMetric" TEXT,
    "usageInterval" INTEGER,
    "lastPerformed" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "nextDueUsage" INTEGER,
    "checklistItems" TEXT,
    "autoCreateWO" BOOLEAN NOT NULL DEFAULT true,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedToId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PMSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
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
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "resolutionNotes" TEXT,
    "slaDeadline" TIMESTAMP(3),
    "slaStatus" TEXT,
    "actualCost" DECIMAL(65,30),
    "images" TEXT,
    "documents" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketComment" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "images" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAttachment" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketActivity" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SparePart" (
    "id" SERIAL NOT NULL,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "supplier" TEXT,
    "supplierPartNo" TEXT,
    "unitCost" DECIMAL(65,30),
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "maxStock" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "storageLocation" TEXT,
    "binLocation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentSparePart" (
    "id" SERIAL NOT NULL,
    "componentId" INTEGER NOT NULL,
    "sparePartId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isRecommended" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "ComponentSparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" SERIAL NOT NULL,
    "sparePartId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "estimatedCost" DECIMAL(65,30),
    "actualCost" DECIMAL(65,30),
    "finalCost" DECIMAL(65,30),
    "stockAfter" INTEGER NOT NULL,
    "notes" TEXT,
    "performedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "readings" TEXT,
    "cost" DECIMAL(65,30),
    "partsChanged" TEXT,
    "nextServiceDue" TIMESTAMP(3),
    "images" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ACInspectionTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "checklistItems" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ACInspectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ACInspectionRecord" (
    "id" SERIAL NOT NULL,
    "fmAssetId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectedById" INTEGER NOT NULL,
    "checklistResults" TEXT NOT NULL,
    "overallStatus" TEXT NOT NULL,
    "notes" TEXT,
    "images" TEXT,
    "nextInspectionDue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ACInspectionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberingConfig" (
    "id" SERIAL NOT NULL,
    "module" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "includeYear" BOOLEAN NOT NULL DEFAULT true,
    "includeMonth" BOOLEAN NOT NULL DEFAULT false,
    "sequenceDigits" INTEGER NOT NULL DEFAULT 3,
    "separator" TEXT NOT NULL DEFAULT '-',
    "resetAnnually" BOOLEAN NOT NULL DEFAULT true,
    "currentYear" INTEGER,
    "currentMonth" INTEGER,
    "currentSeq" INTEGER NOT NULL DEFAULT 0,
    "exampleOutput" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NumberingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryCategory" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryVendor" (
    "id" SERIAL NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryItem" (
    "id" SERIAL NOT NULL,
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
    "unitCost" DECIMAL(65,30),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "StationaryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryLocation" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'warehouse',
    "departmentId" INTEGER,
    "address" TEXT,
    "capacity" TEXT,
    "managedById" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryStock" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "unitCost" DECIMAL(65,30),
    "totalValue" DECIMAL(65,30),
    "lastStocktakeDate" TIMESTAMP(3),
    "lastStocktakeQuantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryRequisition" (
    "id" SERIAL NOT NULL,
    "requisitionNo" TEXT NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "requestedForType" TEXT NOT NULL DEFAULT 'department',
    "requestedForUserId" INTEGER,
    "purpose" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedByL1Id" INTEGER,
    "approvedByL1At" TIMESTAMP(3),
    "approvedByL2Id" INTEGER,
    "approvedByL2At" TIMESTAMP(3),
    "rejectedById" INTEGER,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "issuedById" INTEGER,
    "issuedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalEstimatedCost" DECIMAL(65,30),
    "totalActualCost" DECIMAL(65,30),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryRequisitionItem" (
    "id" SERIAL NOT NULL,
    "requisitionId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantityRequested" INTEGER NOT NULL,
    "quantityApproved" INTEGER,
    "quantityIssued" INTEGER NOT NULL DEFAULT 0,
    "estimatedUnitCost" DECIMAL(65,30),
    "estimatedTotal" DECIMAL(65,30),
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryRequisitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryIssue" (
    "id" SERIAL NOT NULL,
    "issueNo" TEXT NOT NULL,
    "requisitionId" INTEGER,
    "issuedById" INTEGER NOT NULL,
    "issuedToId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'collection',
    "deliveryDate" TIMESTAMP(3),
    "deliveryNotes" TEXT,
    "acknowledgedById" INTEGER,
    "acknowledgedAt" TIMESTAMP(3),
    "totalCost" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryIssueItem" (
    "id" SERIAL NOT NULL,
    "issueId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(65,30),
    "totalCost" DECIMAL(65,30),
    "batchNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryIssueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryReturn" (
    "id" SERIAL NOT NULL,
    "returnNo" TEXT NOT NULL,
    "returnedById" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "returnType" TEXT NOT NULL DEFAULT 'unused',
    "returnReason" TEXT,
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryReturnItem" (
    "id" SERIAL NOT NULL,
    "returnId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryPurchaseOrder" (
    "id" SERIAL NOT NULL,
    "poNumber" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30),
    "shippingCost" DECIMAL(65,30),
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "receivedById" INTEGER,
    "receivedAt" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "notes" TEXT,
    "termsConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryPurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationaryPurchaseOrderItem" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantityOrdered" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationaryPurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentBudget" (
    "id" SERIAL NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "fiscalQuarter" INTEGER,
    "fiscalMonth" INTEGER,
    "allocatedAmount" DECIMAL(65,30) NOT NULL,
    "spentAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "committedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "availableAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "alertThreshold" INTEGER NOT NULL DEFAULT 80,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Module_code_key" ON "Module"("code");

-- CreateIndex
CREATE INDEX "Module_category_idx" ON "Module"("category");

-- CreateIndex
CREATE INDEX "Module_isActive_idx" ON "Module"("isActive");

-- CreateIndex
CREATE INDEX "ModulePermission_moduleId_idx" ON "ModulePermission"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "ModulePermission_moduleId_action_key" ON "ModulePermission"("moduleId", "action");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_departmentId_key" ON "Role"("name", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetCode_key" ON "Asset"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_inspectionNumber_key" ON "Inspection"("inspectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_assignmentNumber_key" ON "Assignment"("assignmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_signatureToken_key" ON "Assignment"("signatureToken");

-- CreateIndex
CREATE UNIQUE INDEX "BorrowTransaction_transactionNumber_key" ON "BorrowTransaction"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BorrowTransaction_signatureToken_key" ON "BorrowTransaction"("signatureToken");

-- CreateIndex
CREATE INDEX "BorrowTransaction_status_idx" ON "BorrowTransaction"("status");

-- CreateIndex
CREATE INDEX "BorrowTransaction_assignmentId_idx" ON "BorrowTransaction"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_name_key" ON "Domain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAccount_email_key" ON "EmailAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "NotificationRecipient_category_isActive_idx" ON "NotificationRecipient"("category", "isActive");

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
CREATE INDEX "PMSchedule_componentId_idx" ON "PMSchedule"("componentId");

-- CreateIndex
CREATE INDEX "PMSchedule_nextDueDate_idx" ON "PMSchedule"("nextDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_inspectionId_key" ON "Ticket"("inspectionId");

-- CreateIndex
CREATE INDEX "Ticket_itAssetId_idx" ON "Ticket"("itAssetId");

-- CreateIndex
CREATE INDEX "Ticket_fmAssetId_idx" ON "Ticket"("fmAssetId");

-- CreateIndex
CREATE INDEX "Ticket_inspectionId_idx" ON "Ticket"("inspectionId");

-- CreateIndex
CREATE INDEX "Ticket_reportedById_idx" ON "Ticket"("reportedById");

-- CreateIndex
CREATE INDEX "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");

-- CreateIndex
CREATE INDEX "Ticket_affectedUserId_idx" ON "Ticket"("affectedUserId");

-- CreateIndex
CREATE INDEX "Ticket_slaStatus_idx" ON "Ticket"("slaStatus");

-- CreateIndex
CREATE INDEX "Ticket_slaDeadline_idx" ON "Ticket"("slaDeadline");

-- CreateIndex
CREATE INDEX "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");

-- CreateIndex
CREATE INDEX "TicketAttachment_ticketId_idx" ON "TicketAttachment"("ticketId");

-- CreateIndex
CREATE INDEX "TicketAttachment_uploadedById_idx" ON "TicketAttachment"("uploadedById");

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

-- CreateIndex
CREATE UNIQUE INDEX "NumberingConfig_module_key" ON "NumberingConfig"("module");

-- CreateIndex
CREATE INDEX "NumberingConfig_module_idx" ON "NumberingConfig"("module");

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
CREATE INDEX "StationaryRequisition_requestedForUserId_idx" ON "StationaryRequisition"("requestedForUserId");

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
CREATE UNIQUE INDEX "DepartmentBudget_departmentId_fiscalYear_fiscalQuarter_fisc_key" ON "DepartmentBudget"("departmentId", "fiscalYear", "fiscalQuarter", "fiscalMonth");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulePermission" ADD CONSTRAINT "ModulePermission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "ModulePermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowTransaction" ADD CONSTRAINT "BorrowTransaction_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowTransaction" ADD CONSTRAINT "BorrowTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowTransaction" ADD CONSTRAINT "BorrowTransaction_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowItem" ADD CONSTRAINT "BorrowItem_checkoutInspectionId_fkey" FOREIGN KEY ("checkoutInspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowItem" ADD CONSTRAINT "BorrowItem_borrowTransactionId_fkey" FOREIGN KEY ("borrowTransactionId") REFERENCES "BorrowTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowItem" ADD CONSTRAINT "BorrowItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnTransaction" ADD CONSTRAINT "ReturnTransaction_checkinInspectionId_fkey" FOREIGN KEY ("checkinInspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnTransaction" ADD CONSTRAINT "ReturnTransaction_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnTransaction" ADD CONSTRAINT "ReturnTransaction_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnTransactionId_fkey" FOREIGN KEY ("returnTransactionId") REFERENCES "ReturnTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_borrowItemId_fkey" FOREIGN KEY ("borrowItemId") REFERENCES "BorrowItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMTask" ADD CONSTRAINT "PMTask_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMTask" ADD CONSTRAINT "PMTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES "EmailAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FMAsset" ADD CONSTRAINT "FMAsset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FMAssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FMAsset" ADD CONSTRAINT "FMAsset_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "FMAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FMAsset" ADD CONSTRAINT "FMAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetComponent" ADD CONSTRAINT "AssetComponent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FMAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentService" ADD CONSTRAINT "ComponentService_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "AssetComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMSchedule" ADD CONSTRAINT "PMSchedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FMAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMSchedule" ADD CONSTRAINT "PMSchedule_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "AssetComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMSchedule" ADD CONSTRAINT "PMSchedule_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_itAssetId_fkey" FOREIGN KEY ("itAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_fmAssetId_fkey" FOREIGN KEY ("fmAssetId") REFERENCES "FMAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_affectedUserId_fkey" FOREIGN KEY ("affectedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketActivity" ADD CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketActivity" ADD CONSTRAINT "TicketActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentSparePart" ADD CONSTRAINT "ComponentSparePart_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "AssetComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentSparePart" ADD CONSTRAINT "ComponentSparePart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FMAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ACInspectionRecord" ADD CONSTRAINT "ACInspectionRecord_fmAssetId_fkey" FOREIGN KEY ("fmAssetId") REFERENCES "FMAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ACInspectionRecord" ADD CONSTRAINT "ACInspectionRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ACInspectionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ACInspectionRecord" ADD CONSTRAINT "ACInspectionRecord_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryCategory" ADD CONSTRAINT "StationaryCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StationaryCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryItem" ADD CONSTRAINT "StationaryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "StationaryCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryItem" ADD CONSTRAINT "StationaryItem_defaultVendorId_fkey" FOREIGN KEY ("defaultVendorId") REFERENCES "StationaryVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryItem" ADD CONSTRAINT "StationaryItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryLocation" ADD CONSTRAINT "StationaryLocation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryLocation" ADD CONSTRAINT "StationaryLocation_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryStock" ADD CONSTRAINT "StationaryStock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StationaryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryStock" ADD CONSTRAINT "StationaryStock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StationaryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryRequisition" ADD CONSTRAINT "StationaryRequisition_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryRequisition" ADD CONSTRAINT "StationaryRequisition_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryRequisition" ADD CONSTRAINT "StationaryRequisition_requestedForUserId_fkey" FOREIGN KEY ("requestedForUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryRequisition" ADD CONSTRAINT "StationaryRequisition_approvedByL1Id_fkey" FOREIGN KEY ("approvedByL1Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryRequisition" ADD CONSTRAINT "StationaryRequisition_approvedByL2Id_fkey" FOREIGN KEY ("approvedByL2Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryRequisition" ADD CONSTRAINT "StationaryRequisition_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryRequisition" ADD CONSTRAINT "StationaryRequisition_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryRequisitionItem" ADD CONSTRAINT "StationaryRequisitionItem_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "StationaryRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryRequisitionItem" ADD CONSTRAINT "StationaryRequisitionItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StationaryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryIssue" ADD CONSTRAINT "StationaryIssue_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "StationaryRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryIssue" ADD CONSTRAINT "StationaryIssue_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryIssue" ADD CONSTRAINT "StationaryIssue_issuedToId_fkey" FOREIGN KEY ("issuedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryIssue" ADD CONSTRAINT "StationaryIssue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryIssue" ADD CONSTRAINT "StationaryIssue_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StationaryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryIssue" ADD CONSTRAINT "StationaryIssue_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryIssueItem" ADD CONSTRAINT "StationaryIssueItem_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "StationaryIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryIssueItem" ADD CONSTRAINT "StationaryIssueItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StationaryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryReturn" ADD CONSTRAINT "StationaryReturn_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryReturn" ADD CONSTRAINT "StationaryReturn_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryReturn" ADD CONSTRAINT "StationaryReturn_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryReturnItem" ADD CONSTRAINT "StationaryReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "StationaryReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryReturnItem" ADD CONSTRAINT "StationaryReturnItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StationaryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryPurchaseOrder" ADD CONSTRAINT "StationaryPurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "StationaryVendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryPurchaseOrder" ADD CONSTRAINT "StationaryPurchaseOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryPurchaseOrder" ADD CONSTRAINT "StationaryPurchaseOrder_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryPurchaseOrder" ADD CONSTRAINT "StationaryPurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryPurchaseOrderItem" ADD CONSTRAINT "StationaryPurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "StationaryPurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationaryPurchaseOrderItem" ADD CONSTRAINT "StationaryPurchaseOrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StationaryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentBudget" ADD CONSTRAINT "DepartmentBudget_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
