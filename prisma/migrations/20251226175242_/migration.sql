-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "departmentId" INTEGER,
    "permissions" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'department',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Role_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Role" ("createdAt", "departmentId", "id", "isActive", "name", "permissions", "scope", "updatedAt") SELECT "createdAt", "departmentId", "id", "isActive", "name", "permissions", "scope", "updatedAt" FROM "Role";
DROP TABLE "Role";
ALTER TABLE "new_Role" RENAME TO "Role";
CREATE UNIQUE INDEX "Role_name_departmentId_key" ON "Role"("name", "departmentId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
