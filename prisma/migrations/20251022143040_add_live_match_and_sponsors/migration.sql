/*
  Warnings:

  - You are about to drop the `FooterLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FooterSection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PushLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PushNotification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PushPermissionScreen` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PushSubscriber` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FooterLink";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FooterSection";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PushLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PushNotification";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PushPermissionScreen";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PushSubscriber";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "BankoCoupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "date" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalOdd" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "upVotes" INTEGER NOT NULL DEFAULT 0,
    "downVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BankoMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "couponId" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "league" TEXT,
    "startTime" DATETIME,
    "prediction" TEXT,
    "odd" REAL,
    "resultScore" TEXT,
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankoMatch_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "BankoCoupon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PageSponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageKey" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "clickUrl" TEXT,
    "altText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LiveMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchTitle" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "league" TEXT,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bannerSetKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "BankoCoupon_date_idx" ON "BankoCoupon"("date");

-- CreateIndex
CREATE INDEX "BankoMatch_couponId_idx" ON "BankoMatch"("couponId");

-- CreateIndex
CREATE INDEX "PageSponsor_pageKey_placement_idx" ON "PageSponsor"("pageKey", "placement");
