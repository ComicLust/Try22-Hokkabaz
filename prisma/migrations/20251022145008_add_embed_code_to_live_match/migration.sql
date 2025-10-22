-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LiveMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchTitle" TEXT NOT NULL,
    "embedUrl" TEXT,
    "embedCode" TEXT,
    "league" TEXT,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bannerSetKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LiveMatch" ("bannerSetKey", "createdAt", "date", "embedUrl", "id", "isActive", "league", "matchTitle", "status", "updatedAt") SELECT "bannerSetKey", "createdAt", "date", "embedUrl", "id", "isActive", "league", "matchTitle", "status", "updatedAt" FROM "LiveMatch";
DROP TABLE "LiveMatch";
ALTER TABLE "new_LiveMatch" RENAME TO "LiveMatch";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
