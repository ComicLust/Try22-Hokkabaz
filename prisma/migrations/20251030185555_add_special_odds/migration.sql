-- CreateTable
CREATE TABLE "SpecialOdd" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandName" TEXT NOT NULL,
    "matchTitle" TEXT NOT NULL,
    "oddsLabel" TEXT NOT NULL,
    "conditions" TEXT,
    "imageUrl" TEXT,
    "ctaUrl" TEXT,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "SpecialOdd_isActive_priority_idx" ON "SpecialOdd"("isActive", "priority");
