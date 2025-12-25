-- CreateTable
CREATE TABLE "Inspection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetId" INTEGER NOT NULL,
    "inspectionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectionType" TEXT NOT NULL,
    "inspectorId" INTEGER NOT NULL,
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
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inspection_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BorrowTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assignmentId" INTEGER NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "borrowDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "borrowerSignature" TEXT,
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "signatureToken" TEXT,
    "signatureTokenExpiry" DATETIME,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" DATETIME,
    "checkoutInspectionId" INTEGER,
    "signedPdfPath" TEXT,
    "signedPdfGeneratedAt" DATETIME,
    CONSTRAINT "BorrowTransaction_checkoutInspectionId_fkey" FOREIGN KEY ("checkoutInspectionId") REFERENCES "Inspection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BorrowTransaction_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BorrowTransaction" ("assignmentId", "borrowDate", "borrowerSignature", "createdById", "id", "isSigned", "notes", "signatureToken", "signatureTokenExpiry", "signedAt", "transactionNumber") SELECT "assignmentId", "borrowDate", "borrowerSignature", "createdById", "id", "isSigned", "notes", "signatureToken", "signatureTokenExpiry", "signedAt", "transactionNumber" FROM "BorrowTransaction";
DROP TABLE "BorrowTransaction";
ALTER TABLE "new_BorrowTransaction" RENAME TO "BorrowTransaction";
CREATE UNIQUE INDEX "BorrowTransaction_transactionNumber_key" ON "BorrowTransaction"("transactionNumber");
CREATE UNIQUE INDEX "BorrowTransaction_signatureToken_key" ON "BorrowTransaction"("signatureToken");
CREATE TABLE "new_ReturnTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assignmentId" INTEGER NOT NULL,
    "returnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedById" INTEGER NOT NULL,
    "checkerSignature" TEXT,
    "notes" TEXT,
    "checkinInspectionId" INTEGER,
    CONSTRAINT "ReturnTransaction_checkinInspectionId_fkey" FOREIGN KEY ("checkinInspectionId") REFERENCES "Inspection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReturnTransaction_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnTransaction_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReturnTransaction" ("assignmentId", "checkedById", "checkerSignature", "id", "notes", "returnDate") SELECT "assignmentId", "checkedById", "checkerSignature", "id", "notes", "returnDate" FROM "ReturnTransaction";
DROP TABLE "ReturnTransaction";
ALTER TABLE "new_ReturnTransaction" RENAME TO "ReturnTransaction";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
