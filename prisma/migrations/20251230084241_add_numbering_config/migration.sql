-- CreateTable
CREATE TABLE "NumberingConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "module" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "includeYear" BOOLEAN NOT NULL DEFAULT true,
    "includeMonth" BOOLEAN NOT NULL DEFAULT false,
    "sequenceDigits" INTEGER NOT NULL DEFAULT 3,
    "separator" TEXT NOT NULL DEFAULT '-',
    "resetAnnually" BOOLEAN NOT NULL DEFAULT true,
    "currentYear" INTEGER,
    "currentMonth" INTEGER,
    "currentSeq" INTEGER NOT NULL DEFAULT 0,
    "exampleOutput" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "NumberingConfig_module_key" ON "NumberingConfig"("module");

-- CreateIndex
CREATE INDEX "NumberingConfig_module_idx" ON "NumberingConfig"("module");
