-- AlterTable
ALTER TABLE "Campground" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "taxIdName" TEXT NOT NULL DEFAULT 'Tax ID';

-- AlterTable
ALTER TABLE "TaxRule" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general';

-- AlterTable
ALTER TABLE "UtilityMeter" ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "SmartLock" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteId" TEXT,
    "name" TEXT,
    "vendor" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'locked',
    "batteryLevel" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmartLock_campgroundId_idx" ON "SmartLock"("campgroundId");

-- CreateIndex
CREATE INDEX "SmartLock_siteId_idx" ON "SmartLock"("siteId");

-- AddForeignKey
ALTER TABLE "SmartLock" ADD CONSTRAINT "SmartLock_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartLock" ADD CONSTRAINT "SmartLock_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
