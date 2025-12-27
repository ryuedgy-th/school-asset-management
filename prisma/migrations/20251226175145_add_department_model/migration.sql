/*
  Warnings:

  - Added the required column `updatedAt` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" DATETIME,
    "warrantyExp" DATETIME,
    "vendor" TEXT,
    "cost" DECIMAL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "image" TEXT,
    "totalStock" INTEGER NOT NULL DEFAULT 1,
    "currentStock" INTEGER NOT NULL DEFAULT 1,
    "departmentId" INTEGER,
    CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Asset" ("assetCode", "brand", "category", "cost", "currentStock", "id", "image", "location", "model", "name", "purchaseDate", "serialNumber", "status", "totalStock", "vendor", "warrantyExp") SELECT "assetCode", "brand", "category", "cost", "currentStock", "id", "image", "location", "model", "name", "purchaseDate", "serialNumber", "status", "totalStock", "vendor", "warrantyExp" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE UNIQUE INDEX "Asset_assetCode_key" ON "Asset"("assetCode");
CREATE TABLE "new_Role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "departmentId" INTEGER,
    "permissions" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'department',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Role" ("id", "name", "permissions", "updatedAt", "createdAt") 
SELECT "id", "name", "permissions", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Role";
DROP TABLE "Role";
ALTER TABLE "new_Role" RENAME TO "Role";
CREATE UNIQUE INDEX "Role_name_departmentId_key" ON "Role"("name", "departmentId");
CREATE TABLE "new_Inspection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inspectionNumber" TEXT,
    "assetId" INTEGER NOT NULL,
    "inspectionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "estimatedCost" DECIMAL DEFAULT 0,
    "photoUrls" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "acknowledgementPdfGenerated" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgementPdfPath" TEXT,
    "damageStatus" TEXT DEFAULT 'pending_review',
    "damageSeverity" TEXT,
    "canContinueUse" BOOLEAN NOT NULL DEFAULT false,
    "repairStatus" TEXT,
    "repairStartDate" DATETIME,
    "repairCompletedDate" DATETIME,
    "repairCost" DECIMAL,
    "repairNotes" TEXT,
    "repairedBy" TEXT,
    "approvedBy" INTEGER,
    "approvedAt" DATETIME,
    "approvalNotes" TEXT,
    "formSentAt" DATETIME,
    "formSignedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inspection_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspection_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspection_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspection_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inspection" ("acknowledgementPdfGenerated", "acknowledgementPdfPath", "approvalNotes", "approvedAt", "approvedBy", "assetId", "assignmentId", "batteryHealth", "buttonPortCondition", "buttonPortNotes", "canContinueUse", "createdAt", "damageDescription", "damageFound", "damageSeverity", "damageStatus", "emailSent", "emailSentAt", "estimatedCost", "exteriorCondition", "exteriorNotes", "formSentAt", "formSignedAt", "id", "inspectionDate", "inspectionNumber", "inspectionType", "inspectorId", "keyboardCondition", "keyboardNotes", "notes", "overallCondition", "photoUrls", "repairCompletedDate", "repairCost", "repairNotes", "repairStartDate", "repairStatus", "repairedBy", "screenCondition", "screenNotes", "touchpadCondition") SELECT "acknowledgementPdfGenerated", "acknowledgementPdfPath", "approvalNotes", "approvedAt", "approvedBy", "assetId", "assignmentId", "batteryHealth", "buttonPortCondition", "buttonPortNotes", "canContinueUse", "createdAt", "damageDescription", "damageFound", "damageSeverity", "damageStatus", "emailSent", "emailSentAt", "estimatedCost", "exteriorCondition", "exteriorNotes", "formSentAt", "formSignedAt", "id", "inspectionDate", "inspectionNumber", "inspectionType", "inspectorId", "keyboardCondition", "keyboardNotes", "notes", "overallCondition", "photoUrls", "repairCompletedDate", "repairCost", "repairNotes", "repairStartDate", "repairStatus", "repairedBy", "screenCondition", "screenNotes", "touchpadCondition" FROM "Inspection";
DROP TABLE "Inspection";
ALTER TABLE "new_Inspection" RENAME TO "Inspection";
CREATE UNIQUE INDEX "Inspection_inspectionNumber_key" ON "Inspection"("inspectionNumber");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "nickname" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'User',
    "roleId" INTEGER,
    "department" TEXT,
    "departmentId" INTEGER,
    "phoneNumber" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lastLoginAttempt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "department", "email", "emailVerified", "failedLoginAttempts", "id", "image", "lastLoginAttempt", "lockedUntil", "name", "nickname", "password", "phoneNumber", "role", "roleId", "updatedAt") SELECT "createdAt", "department", "email", "emailVerified", "failedLoginAttempts", "id", "image", "lastLoginAttempt", "lockedUntil", "name", "nickname", "password", "phoneNumber", "role", "roleId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");
