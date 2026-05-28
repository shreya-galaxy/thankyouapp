-- CreateTable
CREATE TABLE "SubscriptionClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "source" TEXT,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SubscriptionClick_shop_createdAt_idx" ON "SubscriptionClick"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionClick_orderId_idx" ON "SubscriptionClick"("orderId");
