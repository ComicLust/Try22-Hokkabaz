-- CreateTable
CREATE TABLE "PushSubscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uuid" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "browser" TEXT,
    "device" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribedAt" DATETIME
);

-- CreateTable
CREATE TABLE "PushNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "clickAction" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "segment" TEXT NOT NULL DEFAULT 'all',
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "receivedCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PushLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "sentAt" DATETIME,
    "receivedAt" DATETIME,
    "clickedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PushLog_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "PushNotification" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PushLog_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "PushSubscriber" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscriber_endpoint_key" ON "PushSubscriber"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscriber_isActive_idx" ON "PushSubscriber"("isActive");

-- CreateIndex
CREATE INDEX "PushSubscriber_createdAt_idx" ON "PushSubscriber"("createdAt");

-- CreateIndex
CREATE INDEX "PushSubscriber_lastActiveAt_idx" ON "PushSubscriber"("lastActiveAt");

-- CreateIndex
CREATE INDEX "PushNotification_createdAt_idx" ON "PushNotification"("createdAt");

-- CreateIndex
CREATE INDEX "PushLog_notificationId_idx" ON "PushLog"("notificationId");

-- CreateIndex
CREATE INDEX "PushLog_subscriberId_idx" ON "PushLog"("subscriberId");

-- CreateIndex
CREATE INDEX "PushLog_status_idx" ON "PushLog"("status");
