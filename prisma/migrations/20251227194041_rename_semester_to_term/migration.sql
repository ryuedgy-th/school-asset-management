-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assignmentNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "itClosureSignature" TEXT,
    "closedById" INTEGER,
    "closureNotes" TEXT,
    "signatureToken" TEXT,
    "signatureTokenExpiry" DATETIME,
    "signedPdfPath" TEXT,
    CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copy data from old table, mapping semester to term
INSERT INTO "new_Assignment" SELECT "id", "assignmentNumber", "userId", "academicYear", "semester", "status", "createdAt", "closedAt", "itClosureSignature", "closedById", "closureNotes", NULL, NULL, NULL FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE UNIQUE INDEX "Assignment_assignmentNumber_key" ON "Assignment"("assignmentNumber");
CREATE UNIQUE INDEX "Assignment_signatureToken_key" ON "Assignment"("signatureToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
