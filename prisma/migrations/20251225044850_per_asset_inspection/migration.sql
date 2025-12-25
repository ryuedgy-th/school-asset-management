/*
  Warnings:

  - You are about to drop the column `checkoutInspectionId` on the `BorrowTransaction` table. All the data in the column will be lost.

*/
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
    "signedPdfPath" TEXT,
    "signedPdfGeneratedAt" DATETIME,
    CONSTRAINT "BorrowTransaction_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BorrowTransaction" ("assignmentId", "borrowDate", "borrowerSignature", "createdById", "id", "isSigned", "notes", "signatureToken", "signatureTokenExpiry", "signedAt", "signedPdfGeneratedAt", "signedPdfPath", "transactionNumber") SELECT "assignmentId", "borrowDate", "borrowerSignature", "createdById", "id", "isSigned", "notes", "signatureToken", "signatureTokenExpiry", "signedAt", "signedPdfGeneratedAt", "signedPdfPath", "transactionNumber" FROM "BorrowTransaction";
DROP TABLE "BorrowTransaction";
ALTER TABLE "new_BorrowTransaction" RENAME TO "BorrowTransaction";
CREATE UNIQUE INDEX "BorrowTransaction_transactionNumber_key" ON "BorrowTransaction"("transactionNumber");
CREATE UNIQUE INDEX "BorrowTransaction_signatureToken_key" ON "BorrowTransaction"("signatureToken");
CREATE TABLE "new_BorrowItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "borrowTransactionId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Borrowed',
    "checkoutInspectionId" INTEGER,
    CONSTRAINT "BorrowItem_checkoutInspectionId_fkey" FOREIGN KEY ("checkoutInspectionId") REFERENCES "Inspection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BorrowItem_borrowTransactionId_fkey" FOREIGN KEY ("borrowTransactionId") REFERENCES "BorrowTransaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BorrowItem" ("assetId", "borrowTransactionId", "id", "quantity", "status") SELECT "assetId", "borrowTransactionId", "id", "quantity", "status" FROM "BorrowItem";
DROP TABLE "BorrowItem";
ALTER TABLE "new_BorrowItem" RENAME TO "BorrowItem";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
