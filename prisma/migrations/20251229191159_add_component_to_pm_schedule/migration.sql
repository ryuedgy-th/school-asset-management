-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PMSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "lastPerformed" DATETIME,
    "nextDueDate" DATETIME,
    "nextDueUsage" INTEGER,
    "checklistItems" TEXT,
    "autoCreateWO" BOOLEAN NOT NULL DEFAULT true,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedToId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PMSchedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FMAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PMSchedule_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "AssetComponent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PMSchedule_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PMSchedule" ("assetId", "assignedToId", "autoCreateWO", "checklistItems", "createdAt", "description", "frequency", "id", "intervalUnit", "intervalValue", "isActive", "lastPerformed", "leadTimeDays", "name", "nextDueDate", "nextDueUsage", "priority", "scheduleType", "updatedAt", "usageInterval", "usageMetric") SELECT "assetId", "assignedToId", "autoCreateWO", "checklistItems", "createdAt", "description", "frequency", "id", "intervalUnit", "intervalValue", "isActive", "lastPerformed", "leadTimeDays", "name", "nextDueDate", "nextDueUsage", "priority", "scheduleType", "updatedAt", "usageInterval", "usageMetric" FROM "PMSchedule";
DROP TABLE "PMSchedule";
ALTER TABLE "new_PMSchedule" RENAME TO "PMSchedule";
CREATE INDEX "PMSchedule_assetId_idx" ON "PMSchedule"("assetId");
CREATE INDEX "PMSchedule_componentId_idx" ON "PMSchedule"("componentId");
CREATE INDEX "PMSchedule_nextDueDate_idx" ON "PMSchedule"("nextDueDate");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "nickname" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "roleId" INTEGER,
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
INSERT INTO "new_User" ("createdAt", "departmentId", "email", "emailVerified", "failedLoginAttempts", "id", "image", "lastLoginAttempt", "lockedUntil", "name", "nickname", "password", "phoneNumber", "roleId", "updatedAt") SELECT "createdAt", "departmentId", "email", "emailVerified", "failedLoginAttempts", "id", "image", "lastLoginAttempt", "lockedUntil", "name", "nickname", "password", "phoneNumber", "roleId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
