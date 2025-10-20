-- CreateTable
CREATE TABLE "TelegramSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ctaUrl" TEXT NOT NULL,
    "adminUsername" TEXT,
    "members" INTEGER,
    "imageUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GROUP',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AnalyticsCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "code" TEXT NOT NULL,
    "injectTo" TEXT NOT NULL DEFAULT 'head',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "author" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "isPositive" BOOLEAN,
    "content" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "repliedBy" TEXT,
    "replyText" TEXT,
    "repliedAt" DATETIME,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SiteReview_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "ReviewBrand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SiteReview" ("author", "brandId", "content", "createdAt", "helpfulCount", "id", "isAnonymous", "isApproved", "isPositive", "notHelpfulCount", "rating", "repliedAt", "repliedBy", "replyText", "updatedAt") SELECT "author", "brandId", "content", "createdAt", "helpfulCount", "id", "isAnonymous", "isApproved", "isPositive", "notHelpfulCount", "rating", "repliedAt", "repliedBy", "replyText", "updatedAt" FROM "SiteReview";
DROP TABLE "SiteReview";
ALTER TABLE "new_SiteReview" RENAME TO "SiteReview";
CREATE INDEX "SiteReview_brandId_idx" ON "SiteReview"("brandId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AnalyticsCode_isActive_idx" ON "AnalyticsCode"("isActive");
