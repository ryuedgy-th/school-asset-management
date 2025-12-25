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
    "createdSignature" TEXT,
    "closedSignature" TEXT,
    "signatureToken" TEXT,
    "signatureTokenExpiry" DATETIME,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" DATETIME,
    "signerIp" TEXT,
    CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("academicYear", "assignmentNumber", "closedAt", "closedSignature", "createdAt", "createdSignature", "id", "semester", "status", "userId") SELECT "academicYear", "assignmentNumber", "closedAt", "closedSignature", "createdAt", "createdSignature", "id", "semester", "status", "userId" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE UNIQUE INDEX "Assignment_assignmentNumber_key" ON "Assignment"("assignmentNumber");
CREATE UNIQUE INDEX "Assignment_signatureToken_key" ON "Assignment"("signatureToken");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
