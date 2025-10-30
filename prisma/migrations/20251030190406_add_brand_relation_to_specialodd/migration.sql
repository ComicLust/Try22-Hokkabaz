-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SpecialOdd" (
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
    "brandId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpecialOdd_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ReviewBrand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SpecialOdd" ("brandName", "conditions", "createdAt", "ctaUrl", "expiresAt", "id", "imageUrl", "isActive", "matchTitle", "oddsLabel", "priority", "updatedAt") SELECT "brandName", "conditions", "createdAt", "ctaUrl", "expiresAt", "id", "imageUrl", "isActive", "matchTitle", "oddsLabel", "priority", "updatedAt" FROM "SpecialOdd";
DROP TABLE "SpecialOdd";
ALTER TABLE "new_SpecialOdd" RENAME TO "SpecialOdd";
CREATE INDEX "SpecialOdd_isActive_priority_idx" ON "SpecialOdd"("isActive", "priority");
CREATE INDEX "SpecialOdd_brandId_idx" ON "SpecialOdd"("brandId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
