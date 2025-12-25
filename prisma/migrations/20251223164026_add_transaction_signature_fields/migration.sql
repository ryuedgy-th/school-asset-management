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
    CONSTRAINT "BorrowTransaction_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BorrowTransaction" ("assignmentId", "borrowDate", "borrowerSignature", "createdById", "id", "notes", "transactionNumber") SELECT "assignmentId", "borrowDate", "borrowerSignature", "createdById", "id", "notes", "transactionNumber" FROM "BorrowTransaction";
DROP TABLE "BorrowTransaction";
ALTER TABLE "new_BorrowTransaction" RENAME TO "BorrowTransaction";
CREATE UNIQUE INDEX "BorrowTransaction_transactionNumber_key" ON "BorrowTransaction"("transactionNumber");
CREATE UNIQUE INDEX "BorrowTransaction_signatureToken_key" ON "BorrowTransaction"("signatureToken");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
