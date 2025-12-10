-- Add Campaign related enums and tables (idempotent)

-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CampaignSendStatus" AS ENUM ('queued', 'sent', 'failed', 'unsubscribed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ChannelType" AS ENUM ('email', 'sms', 'both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create CampaignTemplate table if not exists
CREATE TABLE IF NOT EXISTS "CampaignTemplate" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL DEFAULT 'email',
    "category" TEXT DEFAULT 'general',
    "subject" TEXT,
    "html" TEXT,
    "textBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignTemplate_pkey" PRIMARY KEY ("id")
);

-- Create Campaign table if not exists
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "html" TEXT NOT NULL,
    "textBody" TEXT,
    "channel" "ChannelType" NOT NULL DEFAULT 'email',
    "templateId" TEXT,
    "audienceJson" JSONB,
    "suggestedReason" TEXT,
    "variables" JSONB,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- Create CampaignSend table if not exists
CREATE TABLE IF NOT EXISTS "CampaignSend" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "guestId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "channel" "ChannelType" NOT NULL DEFAULT 'email',
    "status" "CampaignSendStatus" NOT NULL DEFAULT 'queued',
    "providerMessageId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignSend_pkey" PRIMARY KEY ("id")
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS "CampaignTemplate_campgroundId_idx" ON "CampaignTemplate"("campgroundId");
CREATE INDEX IF NOT EXISTS "CampaignTemplate_channel_idx" ON "CampaignTemplate"("channel");
CREATE INDEX IF NOT EXISTS "Campaign_campgroundId_idx" ON "Campaign"("campgroundId");
CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX IF NOT EXISTS "CampaignSend_campaignId_idx" ON "CampaignSend"("campaignId");
CREATE INDEX IF NOT EXISTS "CampaignSend_campgroundId_idx" ON "CampaignSend"("campgroundId");
CREATE INDEX IF NOT EXISTS "CampaignSend_guestId_idx" ON "CampaignSend"("guestId");
CREATE INDEX IF NOT EXISTS "CampaignSend_status_idx" ON "CampaignSend"("status");

-- Add foreign keys if not exist (wrapped in DO blocks to handle if they exist)
DO $$ BEGIN
  ALTER TABLE "CampaignTemplate" ADD CONSTRAINT "CampaignTemplate_campgroundId_fkey" 
    FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_campgroundId_fkey" 
    FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_templateId_fkey" 
    FOREIGN KEY ("templateId") REFERENCES "CampaignTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CampaignSend" ADD CONSTRAINT "CampaignSend_campaignId_fkey" 
    FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CampaignSend" ADD CONSTRAINT "CampaignSend_campgroundId_fkey" 
    FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CampaignSend" ADD CONSTRAINT "CampaignSend_guestId_fkey" 
    FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

