/*
  Warnings:

  - You are about to drop the column `closedSignature` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `createdSignature` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `isSigned` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `signatureToken` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `signatureTokenExpiry` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `signedAt` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `signedPdfPath` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `signerIp` on the `Assignment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assignmentNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "itClosureSignature" TEXT,
    "closedById" INTEGER,
    "closureNotes" TEXT,
    CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("academicYear", "assignmentNumber", "closedAt", "createdAt", "id", "semester", "status", "userId") SELECT "academicYear", "assignmentNumber", "closedAt", "createdAt", "id", "semester", "status", "userId" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE UNIQUE INDEX "Assignment_assignmentNumber_key" ON "Assignment"("assignmentNumber");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
