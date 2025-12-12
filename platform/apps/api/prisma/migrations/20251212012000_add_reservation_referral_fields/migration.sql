-- Add missing Reservation referral fields that exist in schema.prisma but not in the DB.
-- This keeps the dev database aligned so seeds and API work.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReferralIncentiveType') THEN
    CREATE TYPE "ReferralIncentiveType" AS ENUM ('percent_discount','amount_discount','credit');
  END IF;
END $$;

ALTER TABLE "Reservation"
  ADD COLUMN IF NOT EXISTS "referralProgramId" TEXT,
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
  ADD COLUMN IF NOT EXISTS "referralSource" TEXT,
  ADD COLUMN IF NOT EXISTS "referralChannel" TEXT,
  ADD COLUMN IF NOT EXISTS "referralIncentiveType" "ReferralIncentiveType",
  ADD COLUMN IF NOT EXISTS "referralIncentiveValue" INTEGER DEFAULT 0;

