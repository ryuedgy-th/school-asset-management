/*
  Warnings:

  - A unique constraint covering the columns `[inspectionNumber]` on the table `Inspection` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "inspectionNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_inspectionNumber_key" ON "Inspection"("inspectionNumber");
