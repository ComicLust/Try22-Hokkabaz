-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReviewBrand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "editorialSummary" TEXT,
    "siteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ReviewBrand" ("createdAt", "editorialSummary", "id", "isActive", "logoUrl", "name", "siteUrl", "slug", "updatedAt") SELECT "createdAt", "editorialSummary", "id", "isActive", "logoUrl", "name", "siteUrl", "slug", "updatedAt" FROM "ReviewBrand";
DROP TABLE "ReviewBrand";
ALTER TABLE "new_ReviewBrand" RENAME TO "ReviewBrand";
CREATE UNIQUE INDEX "ReviewBrand_slug_key" ON "ReviewBrand"("slug");
CREATE TABLE "new_TelegramGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "members" INTEGER,
    "membersText" TEXT,
    "imageUrl" TEXT,
    "ctaUrl" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GROUP',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "badges" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TelegramGroup" ("badges", "createdAt", "ctaUrl", "id", "imageUrl", "isFeatured", "members", "membersText", "name", "type", "updatedAt") SELECT "badges", "createdAt", "ctaUrl", "id", "imageUrl", "isFeatured", "members", "membersText", "name", "type", "updatedAt" FROM "TelegramGroup";
DROP TABLE "TelegramGroup";
ALTER TABLE "new_TelegramGroup" RENAME TO "TelegramGroup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
