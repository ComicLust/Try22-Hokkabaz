/*
  Warnings:

  - You are about to drop the column `isActive` on the `PageSponsor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SeoSetting" ADD COLUMN "ogLogoUrl" TEXT;
ALTER TABLE "SeoSetting" ADD COLUMN "ogType" TEXT;

-- CreateTable
CREATE TABLE "PageArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BrandManager" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BrandManager_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ReviewBrand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bonus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "bonusType" TEXT,
    "gameCategory" TEXT,
    "amount" INTEGER,
    "wager" INTEGER,
    "minDeposit" INTEGER,
    "imageUrl" TEXT,
    "postImageUrl" TEXT,
    "ctaUrl" TEXT,
    "badges" JSONB,
    "validityText" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "brandId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdByLoginId" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bonus_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ReviewBrand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bonus" ("amount", "badges", "bonusType", "createdAt", "ctaUrl", "description", "endDate", "features", "gameCategory", "id", "imageUrl", "isActive", "isFeatured", "minDeposit", "postImageUrl", "priority", "shortDescription", "slug", "startDate", "title", "updatedAt", "validityText", "wager") SELECT "amount", "badges", "bonusType", "createdAt", "ctaUrl", "description", "endDate", "features", "gameCategory", "id", "imageUrl", "isActive", "isFeatured", "minDeposit", "postImageUrl", "priority", "shortDescription", "slug", "startDate", "title", "updatedAt", "validityText", "wager" FROM "Bonus";
DROP TABLE "Bonus";
ALTER TABLE "new_Bonus" RENAME TO "Bonus";
CREATE UNIQUE INDEX "Bonus_slug_key" ON "Bonus"("slug");
CREATE TABLE "new_LiveMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchTitle" TEXT,
    "embedUrl" TEXT,
    "embedCode" TEXT,
    "league" TEXT,
    "date" DATETIME,
    "status" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bannerSetKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LiveMatch" ("bannerSetKey", "createdAt", "date", "embedCode", "embedUrl", "id", "isActive", "league", "matchTitle", "status", "updatedAt") SELECT "bannerSetKey", "createdAt", "date", "embedCode", "embedUrl", "id", "isActive", "league", "matchTitle", "status", "updatedAt" FROM "LiveMatch";
DROP TABLE "LiveMatch";
ALTER TABLE "new_LiveMatch" RENAME TO "LiveMatch";
CREATE INDEX "LiveMatch_isActive_date_idx" ON "LiveMatch"("isActive", "date");
CREATE TABLE "new_PageSponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageKey" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "imageUrl" TEXT,
    "desktopImageUrl" TEXT,
    "mobileImageUrl" TEXT,
    "clickUrl" TEXT,
    "altText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PageSponsor" ("altText", "clickUrl", "createdAt", "desktopImageUrl", "id", "imageUrl", "mobileImageUrl", "pageKey", "placement", "updatedAt") SELECT "altText", "clickUrl", "createdAt", "desktopImageUrl", "id", "imageUrl", "mobileImageUrl", "pageKey", "placement", "updatedAt" FROM "PageSponsor";
DROP TABLE "PageSponsor";
ALTER TABLE "new_PageSponsor" RENAME TO "PageSponsor";
CREATE INDEX "PageSponsor_pageKey_placement_idx" ON "PageSponsor"("pageKey", "placement");
CREATE TABLE "new_TelegramSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ctaUrl" TEXT NOT NULL,
    "adminUsername" TEXT,
    "members" INTEGER,
    "imageUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GROUP',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "badges" JSONB,
    "brandId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TelegramSuggestion_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ReviewBrand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TelegramSuggestion" ("adminUsername", "createdAt", "ctaUrl", "id", "imageUrl", "isApproved", "isRejected", "members", "name", "type", "updatedAt") SELECT "adminUsername", "createdAt", "ctaUrl", "id", "imageUrl", "isApproved", "isRejected", "members", "name", "type", "updatedAt" FROM "TelegramSuggestion";
DROP TABLE "TelegramSuggestion";
ALTER TABLE "new_TelegramSuggestion" RENAME TO "TelegramSuggestion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PageArticle_slug_key" ON "PageArticle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BrandManager_loginId_key" ON "BrandManager"("loginId");
