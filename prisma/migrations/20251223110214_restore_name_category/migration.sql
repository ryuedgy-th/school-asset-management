/*
  Warnings:

  - Added the required column `category` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Asset` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" DATETIME,
    "warrantyExp" DATETIME,
    "vendor" TEXT,
    "cost" DECIMAL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "image" TEXT,
    "totalStock" INTEGER NOT NULL DEFAULT 1,
    "currentStock" INTEGER NOT NULL DEFAULT 1
);
INSERT INTO "new_Asset" ("assetCode", "brand", "cost", "currentStock", "id", "image", "location", "model", "purchaseDate", "serialNumber", "status", "totalStock", "vendor", "warrantyExp") SELECT "assetCode", "brand", "cost", "currentStock", "id", "image", "location", "model", "purchaseDate", "serialNumber", "status", "totalStock", "vendor", "warrantyExp" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE UNIQUE INDEX "Asset_assetCode_key" ON "Asset"("assetCode");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
