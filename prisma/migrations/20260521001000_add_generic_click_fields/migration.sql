-- AlterTable
ALTER TABLE "SubscriptionClick" ADD COLUMN "eventType" TEXT NOT NULL DEFAULT 'subscription';
ALTER TABLE "SubscriptionClick" ADD COLUMN "itemId" TEXT;
ALTER TABLE "SubscriptionClick" ADD COLUMN "itemTitle" TEXT;
ALTER TABLE "SubscriptionClick" ADD COLUMN "itemUrl" TEXT;

-- CreateIndex
CREATE INDEX "SubscriptionClick_shop_eventType_createdAt_idx" ON "SubscriptionClick"("shop", "eventType", "createdAt");
