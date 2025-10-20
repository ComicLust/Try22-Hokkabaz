-- CreateTable
CREATE TABLE "PushPermissionScreen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "description" TEXT,
    "allowText" TEXT DEFAULT 'İzin Ver',
    "laterText" TEXT DEFAULT 'Daha Sonra',
    "bgColor" TEXT DEFAULT '#111827',
    "textColor" TEXT DEFAULT '#FFFFFF',
    "imageUrl" TEXT,
    "position" TEXT NOT NULL DEFAULT 'bottom',
    "radiusClass" TEXT DEFAULT 'rounded-xl',
    "shadowClass" TEXT DEFAULT 'shadow-lg',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
