-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "badgeLabel" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "bonusAmount" INTEGER;
ALTER TABLE "Campaign" ADD COLUMN "tags" JSONB;
