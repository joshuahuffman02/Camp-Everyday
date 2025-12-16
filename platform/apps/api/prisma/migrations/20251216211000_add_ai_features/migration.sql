-- Add AI feature flags to Campground
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiReplyAssistEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiBookingAssistEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiAnalyticsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiForecastingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiAnonymizationLevel" TEXT NOT NULL DEFAULT 'strict';
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiProvider" TEXT NOT NULL DEFAULT 'openai';
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiApiKey" TEXT;
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiConsentCollected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiConsentCollectedAt" TIMESTAMP(3);
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiMonthlyBudgetCents" INTEGER;
ALTER TABLE "Campground" ADD COLUMN IF NOT EXISTS "aiTotalTokensUsed" INTEGER NOT NULL DEFAULT 0;

-- Drop old AI columns if they exist (may fail if already dropped, that's OK)
ALTER TABLE "Campground" DROP COLUMN IF EXISTS "aiSuggestionsEnabled";
ALTER TABLE "Campground" DROP COLUMN IF EXISTS "aiOpenaiApiKey";

-- Create AI feature type enum
DO $$ BEGIN
    CREATE TYPE "AiFeatureType" AS ENUM ('reply_assist', 'booking_assist', 'analytics', 'forecasting', 'anomaly_detection', 'recommendations');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create AI consent type enum
DO $$ BEGIN
    CREATE TYPE "AiConsentType" AS ENUM ('booking_assist', 'personalization', 'communications', 'analytics');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create AiInteractionLog table
CREATE TABLE IF NOT EXISTS "AiInteractionLog" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "featureType" "AiFeatureType" NOT NULL,
    "promptHash" TEXT NOT NULL,
    "responseHash" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorType" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "modelUsed" TEXT,
    "costCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInteractionLog_pkey" PRIMARY KEY ("id")
);

-- Create AiConsentRecord table
CREATE TABLE IF NOT EXISTS "AiConsentRecord" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "guestId" TEXT,
    "sessionId" TEXT,
    "consentType" "AiConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "source" TEXT,

    CONSTRAINT "AiConsentRecord_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "AiInteractionLog_campgroundId_createdAt_idx" ON "AiInteractionLog"("campgroundId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiInteractionLog_featureType_createdAt_idx" ON "AiInteractionLog"("featureType", "createdAt");
CREATE INDEX IF NOT EXISTS "AiInteractionLog_userId_createdAt_idx" ON "AiInteractionLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiConsentRecord_campgroundId_guestId_idx" ON "AiConsentRecord"("campgroundId", "guestId");
CREATE INDEX IF NOT EXISTS "AiConsentRecord_sessionId_idx" ON "AiConsentRecord"("sessionId");
CREATE INDEX IF NOT EXISTS "AiConsentRecord_consentType_granted_idx" ON "AiConsentRecord"("consentType", "granted");
