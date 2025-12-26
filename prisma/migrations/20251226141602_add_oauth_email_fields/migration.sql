/*
  Warnings:

  - You are about to drop the column `accessToken` on the `EmailAccount` table. All the data in the column will be lost.
  - You are about to drop the column `oauthProvider` on the `EmailAccount` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `EmailAccount` table. All the data in the column will be lost.
  - You are about to drop the column `tokenExpiry` on the `EmailAccount` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "oauthClientId" TEXT,
    "oauthClientSecret" TEXT,
    "oauthRefreshToken" TEXT,
    "oauthAccessToken" TEXT,
    "oauthTokenExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EmailAccount" ("createdAt", "email", "id", "isActive", "isDefault", "name", "smtpHost", "smtpPassword", "smtpPort", "smtpSecure", "smtpUser", "type", "updatedAt") SELECT "createdAt", "email", "id", "isActive", "isDefault", "name", "smtpHost", "smtpPassword", "smtpPort", "smtpSecure", "smtpUser", "type", "updatedAt" FROM "EmailAccount";
DROP TABLE "EmailAccount";
ALTER TABLE "new_EmailAccount" RENAME TO "EmailAccount";
CREATE UNIQUE INDEX "EmailAccount_email_key" ON "EmailAccount"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
