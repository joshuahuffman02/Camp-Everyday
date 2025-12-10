-- Phase 2: Housekeeping & Maintenance Groups (idempotent)

-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE "TaskType" AS ENUM ('turnover', 'inspection', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TaskState" AS ENUM ('pending', 'in_progress', 'blocked', 'done', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SlaStatus" AS ENUM ('on_track', 'at_risk', 'breached');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TicketState" AS ENUM ('open', 'in_progress', 'blocked', 'resolved', 'reopened', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Severity" AS ENUM ('low', 'med', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CheckInStatus" AS ENUM ('not_started', 'pending_id', 'pending_payment', 'pending_waiver', 'pending_site_ready', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CheckOutStatus" AS ENUM ('not_started', 'pending_review', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "GroupRole" AS ENUM ('primary', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create or update BackoffStrategy enum
DO $$ BEGIN
  CREATE TYPE "BackoffStrategy" AS ENUM ('fixed', 'linear', 'exponential');
EXCEPTION WHEN duplicate_object THEN 
  -- Type exists, try to add exponential if missing
  BEGIN
    ALTER TYPE "BackoffStrategy" ADD VALUE IF NOT EXISTS 'exponential';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Add columns to MaintenanceTicket if missing
DO $$ BEGIN
  ALTER TABLE "MaintenanceTicket" ADD COLUMN "assignedToTeamId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaintenanceTicket" ADD COLUMN "checklist" JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaintenanceTicket" ADD COLUMN "lockId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaintenanceTicket" ADD COLUMN "notes" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaintenanceTicket" ADD COLUMN "outOfOrder" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaintenanceTicket" ADD COLUMN "outOfOrderReason" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaintenanceTicket" ADD COLUMN "outOfOrderUntil" TIMESTAMP(3);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaintenanceTicket" ADD COLUMN "photos" JSONB;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MaintenanceTicket" ADD COLUMN "reopenedAt" TIMESTAMP(3);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Add columns to Reservation if missing
DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "checkInStatus" "CheckInStatus" NOT NULL DEFAULT 'not_started';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "checkOutStatus" "CheckOutStatus" NOT NULL DEFAULT 'not_started';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "groupId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "groupRole" "GroupRole";
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "idVerificationRequired" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "lateArrivalFlag" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "paymentRequired" BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "selfCheckInAt" TIMESTAMP(3);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "selfCheckOutAt" TIMESTAMP(3);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "siteReady" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "siteReadyAt" TIMESTAMP(3);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Reservation" ADD COLUMN "waiverRequired" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Create Task table if not exists
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "state" "TaskState" NOT NULL,
    "priority" TEXT,
    "siteId" TEXT NOT NULL,
    "reservationId" TEXT,
    "assignedToUserId" TEXT,
    "assignedToTeamId" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "slaStatus" "SlaStatus" NOT NULL DEFAULT 'on_track',
    "checklist" JSONB,
    "photos" JSONB,
    "notes" TEXT,
    "source" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- Create InventoryBlock table if not exists
CREATE TABLE IF NOT EXISTS "InventoryBlock" (
    "blockId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sites" JSONB NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lockId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InventoryBlock_pkey" PRIMARY KEY ("blockId")
);

-- Create Group table if not exists
CREATE TABLE IF NOT EXISTS "Group" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sharedPayment" BOOLEAN NOT NULL DEFAULT false,
    "sharedComm" BOOLEAN NOT NULL DEFAULT false,
    "primaryReservationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS "Task_tenantId_siteId_state_idx" ON "Task"("tenantId", "siteId", "state");
CREATE INDEX IF NOT EXISTS "Task_tenantId_slaStatus_idx" ON "Task"("tenantId", "slaStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryBlock_lockId_key" ON "InventoryBlock"("lockId");
CREATE INDEX IF NOT EXISTS "InventoryBlock_tenantId_idx" ON "InventoryBlock"("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "MaintenanceTicket_lockId_key" ON "MaintenanceTicket"("lockId");
CREATE INDEX IF NOT EXISTS "Reservation_groupId_idx" ON "Reservation"("groupId");
