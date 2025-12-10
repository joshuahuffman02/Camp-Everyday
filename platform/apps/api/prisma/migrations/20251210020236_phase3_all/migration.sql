/*
  Warnings:

  - The values [exp] on the enum `BackoffStrategy` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('support_agent', 'support_lead', 'regional_support', 'ops_engineer', 'platform_admin');

-- CreateEnum
CREATE TYPE "DynamicPricingTrigger" AS ENUM ('occupancy_high', 'occupancy_low', 'demand_surge', 'last_minute', 'advance_booking', 'event_proximity', 'weather', 'manual');

-- CreateEnum
CREATE TYPE "WorkflowTrigger" AS ENUM ('reservation_created', 'reservation_confirmed', 'days_before_arrival', 'check_in', 'days_after_checkin', 'check_out', 'days_after_checkout', 'payment_received', 'payment_failed', 'review_received', 'birthday', 'anniversary', 'manual');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('active', 'paused', 'draft', 'archived');

-- CreateEnum
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "WaiverStatus" AS ENUM ('pending', 'signed', 'expired', 'declined');

-- CreateEnum
CREATE TYPE "IdVerificationStatus" AS ENUM ('pending', 'verified', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "PushNotificationType" AS ENUM ('arrival', 'departure', 'task_assigned', 'task_sla_warning', 'maintenance_urgent', 'payment_received', 'payment_failed', 'message_received', 'general');

-- CreateEnum
CREATE TYPE "ReportScheduleFrequency" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly');

-- AlterEnum
BEGIN;
CREATE TYPE "BackoffStrategy_new" AS ENUM ('fixed', 'linear', 'exponential');
ALTER TABLE "AutoCollectSchedule" ALTER COLUMN "backoffStrategy" TYPE "BackoffStrategy_new" USING ("backoffStrategy"::text::"BackoffStrategy_new");
ALTER TYPE "BackoffStrategy" RENAME TO "BackoffStrategy_old";
ALTER TYPE "BackoffStrategy_new" RENAME TO "BackoffStrategy";
DROP TYPE "BackoffStrategy_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SocialSuggestionType" ADD VALUE 'occupancy';
ALTER TYPE "SocialSuggestionType" ADD VALUE 'event';
ALTER TYPE "SocialSuggestionType" ADD VALUE 'deal';
ALTER TYPE "SocialSuggestionType" ADD VALUE 'seasonal';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "afterHoursAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "channelInventoryMode" "ChannelInventoryMode" NOT NULL DEFAULT 'shared',
ADD COLUMN     "onlineStockQty" INTEGER,
ADD COLUMN     "posStockQty" INTEGER;

-- AlterTable
ALTER TABLE "StoreOrder" ADD COLUMN     "channel" "OrderChannel" NOT NULL DEFAULT 'pos',
ADD COLUMN     "deliveryInstructions" TEXT,
ADD COLUMN     "fulfillmentType" TEXT,
ADD COLUMN     "prepTimeMinutes" INTEGER,
ADD COLUMN     "promisedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "platformActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "platformRegion" TEXT,
ADD COLUMN     "platformRole" "PlatformRole";

-- CreateTable
CREATE TABLE "DynamicPricingRule" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "DynamicPricingTrigger" NOT NULL,
    "conditions" JSONB NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "adjustmentValue" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "siteClassIds" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccupancySnapshot" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalSites" INTEGER NOT NULL,
    "occupied" INTEGER NOT NULL,
    "blocked" INTEGER NOT NULL,
    "available" INTEGER NOT NULL,
    "occupancyPct" DOUBLE PRECISION NOT NULL,
    "revenueCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OccupancySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueForecast" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "forecastDate" DATE NOT NULL,
    "projectedRev" INTEGER NOT NULL,
    "actualRev" INTEGER,
    "occupancyPct" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "factors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationWorkflow" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "WorkflowTrigger" NOT NULL,
    "triggerValue" INTEGER,
    "conditions" JSONB,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'draft',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "reservationId" TEXT,
    "guestId" TEXT,
    "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'pending',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "context" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalWaiver" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "reservationId" TEXT,
    "guestId" TEXT NOT NULL,
    "templateId" TEXT,
    "status" "WaiverStatus" NOT NULL DEFAULT 'pending',
    "signedAt" TIMESTAMP(3),
    "signatureData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "pdfUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalWaiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiverTemplate" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaiverTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdVerification" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "reservationId" TEXT,
    "status" "IdVerificationStatus" NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "providerRef" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "documentType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffShift" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shiftDate" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "notes" TEXT,
    "clockedInAt" TIMESTAMP(3),
    "clockedOutAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAvailability" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotification" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "PushNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffPerformance" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tasksSlaOnTime" INTEGER NOT NULL DEFAULT 0,
    "checkinsHandled" INTEGER NOT NULL DEFAULT 0,
    "avgTaskMinutes" DOUBLE PRECISION,
    "hoursWorked" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedReport" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT,
    "orgId" TEXT,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "scheduleFreq" "ReportScheduleFrequency",
    "scheduleDay" INTEGER,
    "scheduleTime" TEXT,
    "recipients" TEXT[],
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRun" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rowCount" INTEGER,
    "fileUrl" TEXT,
    "error" TEXT,
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortAnalysis" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "cohortType" TEXT NOT NULL,
    "cohortValue" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "bookings" INTEGER NOT NULL,
    "revenue" INTEGER NOT NULL,
    "repeatRate" DOUBLE PRECISION,
    "avgBookingValue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioDashboard" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioDashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioMetric" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "campgroundId" TEXT,
    "metricDate" DATE NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentralizedRatePush" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rateConfig" JSONB NOT NULL,
    "targetCampIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "appliedAt" TIMESTAMP(3),
    "appliedBy" TEXT,
    "results" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentralizedRatePush_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DynamicPricingRule_campgroundId_isActive_idx" ON "DynamicPricingRule"("campgroundId", "isActive");

-- CreateIndex
CREATE INDEX "OccupancySnapshot_campgroundId_date_idx" ON "OccupancySnapshot"("campgroundId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "OccupancySnapshot_campgroundId_date_key" ON "OccupancySnapshot"("campgroundId", "date");

-- CreateIndex
CREATE INDEX "RevenueForecast_campgroundId_forecastDate_idx" ON "RevenueForecast"("campgroundId", "forecastDate");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueForecast_campgroundId_forecastDate_key" ON "RevenueForecast"("campgroundId", "forecastDate");

-- CreateIndex
CREATE INDEX "CommunicationWorkflow_campgroundId_status_idx" ON "CommunicationWorkflow"("campgroundId", "status");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowId_stepOrder_idx" ON "WorkflowStep"("workflowId", "stepOrder");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_status_idx" ON "WorkflowExecution"("workflowId", "status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_reservationId_idx" ON "WorkflowExecution"("reservationId");

-- CreateIndex
CREATE INDEX "DigitalWaiver_campgroundId_status_idx" ON "DigitalWaiver"("campgroundId", "status");

-- CreateIndex
CREATE INDEX "DigitalWaiver_reservationId_idx" ON "DigitalWaiver"("reservationId");

-- CreateIndex
CREATE INDEX "DigitalWaiver_guestId_idx" ON "DigitalWaiver"("guestId");

-- CreateIndex
CREATE INDEX "WaiverTemplate_campgroundId_idx" ON "WaiverTemplate"("campgroundId");

-- CreateIndex
CREATE INDEX "IdVerification_campgroundId_idx" ON "IdVerification"("campgroundId");

-- CreateIndex
CREATE INDEX "IdVerification_guestId_idx" ON "IdVerification"("guestId");

-- CreateIndex
CREATE INDEX "IdVerification_reservationId_idx" ON "IdVerification"("reservationId");

-- CreateIndex
CREATE INDEX "StaffShift_campgroundId_shiftDate_idx" ON "StaffShift"("campgroundId", "shiftDate");

-- CreateIndex
CREATE INDEX "StaffShift_userId_shiftDate_idx" ON "StaffShift"("userId", "shiftDate");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAvailability_campgroundId_userId_dayOfWeek_key" ON "StaffAvailability"("campgroundId", "userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "PushNotification_campgroundId_userId_createdAt_idx" ON "PushNotification"("campgroundId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "StaffPerformance_campgroundId_periodStart_idx" ON "StaffPerformance"("campgroundId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPerformance_campgroundId_userId_periodStart_periodEnd_key" ON "StaffPerformance"("campgroundId", "userId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "SavedReport_campgroundId_idx" ON "SavedReport"("campgroundId");

-- CreateIndex
CREATE INDEX "SavedReport_createdById_idx" ON "SavedReport"("createdById");

-- CreateIndex
CREATE INDEX "ReportRun_reportId_createdAt_idx" ON "ReportRun"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "CohortAnalysis_campgroundId_cohortType_idx" ON "CohortAnalysis"("campgroundId", "cohortType");

-- CreateIndex
CREATE UNIQUE INDEX "CohortAnalysis_campgroundId_cohortType_cohortValue_periodSt_key" ON "CohortAnalysis"("campgroundId", "cohortType", "cohortValue", "periodStart");

-- CreateIndex
CREATE INDEX "PortfolioDashboard_orgId_idx" ON "PortfolioDashboard"("orgId");

-- CreateIndex
CREATE INDEX "PortfolioMetric_orgId_metricDate_idx" ON "PortfolioMetric"("orgId", "metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioMetric_orgId_campgroundId_metricDate_metricType_key" ON "PortfolioMetric"("orgId", "campgroundId", "metricDate", "metricType");

-- CreateIndex
CREATE INDEX "CentralizedRatePush_orgId_idx" ON "CentralizedRatePush"("orgId");

-- AddForeignKey
ALTER TABLE "DynamicPricingRule" ADD CONSTRAINT "DynamicPricingRule_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccupancySnapshot" ADD CONSTRAINT "OccupancySnapshot_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueForecast" ADD CONSTRAINT "RevenueForecast_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationWorkflow" ADD CONSTRAINT "CommunicationWorkflow_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "CommunicationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "CommunicationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalWaiver" ADD CONSTRAINT "DigitalWaiver_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalWaiver" ADD CONSTRAINT "DigitalWaiver_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalWaiver" ADD CONSTRAINT "DigitalWaiver_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverTemplate" ADD CONSTRAINT "WaiverTemplate_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdVerification" ADD CONSTRAINT "IdVerification_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdVerification" ADD CONSTRAINT "IdVerification_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdVerification" ADD CONSTRAINT "IdVerification_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAvailability" ADD CONSTRAINT "StaffAvailability_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAvailability" ADD CONSTRAINT "StaffAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotification" ADD CONSTRAINT "PushNotification_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotification" ADD CONSTRAINT "PushNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPerformance" ADD CONSTRAINT "StaffPerformance_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPerformance" ADD CONSTRAINT "StaffPerformance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReport" ADD CONSTRAINT "SavedReport_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReport" ADD CONSTRAINT "SavedReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "SavedReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioDashboard" ADD CONSTRAINT "PortfolioDashboard_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioDashboard" ADD CONSTRAINT "PortfolioDashboard_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMetric" ADD CONSTRAINT "PortfolioMetric_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMetric" ADD CONSTRAINT "PortfolioMetric_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentralizedRatePush" ADD CONSTRAINT "CentralizedRatePush_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
