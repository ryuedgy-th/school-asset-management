-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inspection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetId" INTEGER NOT NULL,
    "inspectionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectionType" TEXT NOT NULL,
    "inspectorId" INTEGER NOT NULL,
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
    "approvedBy" INTEGER,
    "approvedAt" DATETIME,
    "approvalNotes" TEXT,
    "formSentAt" DATETIME,
    "formSignedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inspection_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspection_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspection_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inspection" ("acknowledgementPdfGenerated", "acknowledgementPdfPath", "assetId", "assignmentId", "batteryHealth", "buttonPortCondition", "buttonPortNotes", "createdAt", "damageDescription", "damageFound", "emailSent", "emailSentAt", "estimatedCost", "exteriorCondition", "exteriorNotes", "id", "inspectionDate", "inspectionType", "inspectorId", "keyboardCondition", "keyboardNotes", "notes", "overallCondition", "photoUrls", "screenCondition", "screenNotes", "touchpadCondition") SELECT "acknowledgementPdfGenerated", "acknowledgementPdfPath", "assetId", "assignmentId", "batteryHealth", "buttonPortCondition", "buttonPortNotes", "createdAt", "damageDescription", "damageFound", "emailSent", "emailSentAt", "estimatedCost", "exteriorCondition", "exteriorNotes", "id", "inspectionDate", "inspectionType", "inspectorId", "keyboardCondition", "keyboardNotes", "notes", "overallCondition", "photoUrls", "screenCondition", "screenNotes", "touchpadCondition" FROM "Inspection";
DROP TABLE "Inspection";
ALTER TABLE "new_Inspection" RENAME TO "Inspection";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
