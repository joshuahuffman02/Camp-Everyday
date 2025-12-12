-- Add missing Reservation fields that exist in schema.prisma but not in the DB.
-- These are required for seeds and runtime queries.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StayReasonPreset') THEN
    CREATE TYPE "StayReasonPreset" AS ENUM (
      'vacation',
      'family_visit',
      'event',
      'work_remote',
      'stopover',
      'relocation',
      'other'
    );
  END IF;
END $$;

ALTER TABLE "Reservation"
  ADD COLUMN IF NOT EXISTS "stayReasonPreset" "StayReasonPreset",
  ADD COLUMN IF NOT EXISTS "stayReasonOther" TEXT,
  ADD COLUMN IF NOT EXISTS "billingCadence" TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS "billingAnchorDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "utilityMeterIds" JSONB,
  ADD COLUMN IF NOT EXISTS "groupId" TEXT,
  ADD COLUMN IF NOT EXISTS "groupRole" "GroupRole",
  ADD COLUMN IF NOT EXISTS "checkInStatus" "CheckInStatus" NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS "checkOutStatus" "CheckOutStatus" NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS "idVerificationRequired" BOOLEAN NOT NULL DEFAULT false;

