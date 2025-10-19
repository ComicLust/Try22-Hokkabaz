-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "ctaUrl" TEXT,
    "badgeLabel" TEXT,
    "bonusAmount" INTEGER,
    "tags" JSONB,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Campaign" ("badgeLabel", "bonusAmount", "createdAt", "ctaUrl", "description", "endDate", "id", "imageUrl", "isActive", "priority", "slug", "startDate", "tags", "title", "updatedAt") SELECT "badgeLabel", "bonusAmount", "createdAt", "ctaUrl", "description", "endDate", "id", "imageUrl", "isActive", "priority", "slug", "startDate", "tags", "title", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
