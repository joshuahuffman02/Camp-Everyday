-- Phase 4: Notifications & Waitlist Enhancements
-- Migration: 20241210_phase4_notifications_waitlist

-- Add new fields to WaitlistEntry
ALTER TABLE "WaitlistEntry" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "WaitlistEntry" ADD COLUMN IF NOT EXISTS "autoOffer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WaitlistEntry" ADD COLUMN IF NOT EXISTS "maxPrice" INTEGER;
ALTER TABLE "WaitlistEntry" ADD COLUMN IF NOT EXISTS "flexibleDates" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WaitlistEntry" ADD COLUMN IF NOT EXISTS "flexibleDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WaitlistEntry" ADD COLUMN IF NOT EXISTS "convertedReservationId" TEXT;
ALTER TABLE "WaitlistEntry" ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP(3);

-- Create index on priority
CREATE INDEX IF NOT EXISTS "WaitlistEntry_priority_idx" ON "WaitlistEntry"("priority");

-- Create NotificationTrigger table
CREATE TABLE IF NOT EXISTS "NotificationTrigger" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "templateId" TEXT,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTrigger_pkey" PRIMARY KEY ("id")
);

-- Create indexes for NotificationTrigger
CREATE INDEX IF NOT EXISTS "NotificationTrigger_campgroundId_idx" ON "NotificationTrigger"("campgroundId");
CREATE INDEX IF NOT EXISTS "NotificationTrigger_event_idx" ON "NotificationTrigger"("event");
CREATE INDEX IF NOT EXISTS "NotificationTrigger_enabled_idx" ON "NotificationTrigger"("enabled");

-- Create ScheduledNotification table
CREATE TABLE IF NOT EXISTS "ScheduledNotification" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
);

-- Create indexes for ScheduledNotification
CREATE INDEX IF NOT EXISTS "ScheduledNotification_campgroundId_idx" ON "ScheduledNotification"("campgroundId");
CREATE INDEX IF NOT EXISTS "ScheduledNotification_status_sendAt_idx" ON "ScheduledNotification"("status", "sendAt");

-- Add foreign keys
ALTER TABLE "NotificationTrigger" 
    ADD CONSTRAINT "NotificationTrigger_campgroundId_fkey" 
    FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationTrigger" 
    ADD CONSTRAINT "NotificationTrigger_templateId_fkey" 
    FOREIGN KEY ("templateId") REFERENCES "CampaignTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScheduledNotification" 
    ADD CONSTRAINT "ScheduledNotification_campgroundId_fkey" 
    FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduledNotification" 
    ADD CONSTRAINT "ScheduledNotification_triggerId_fkey" 
    FOREIGN KEY ("triggerId") REFERENCES "NotificationTrigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;
