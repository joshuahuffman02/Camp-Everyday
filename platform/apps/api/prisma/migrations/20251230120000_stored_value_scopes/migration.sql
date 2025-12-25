-- Add stored value scope types
CREATE TYPE "StoredValueScopeType" AS ENUM ('campground', 'organization', 'global');

ALTER TABLE "StoredValueAccount"
ADD COLUMN "scopeType" "StoredValueScopeType" NOT NULL DEFAULT 'campground',
ADD COLUMN "scopeId" TEXT;

UPDATE "StoredValueAccount"
SET "scopeId" = "campgroundId"
WHERE "scopeId" IS NULL;

CREATE INDEX "StoredValueAccount_scope_idx" ON "StoredValueAccount" ("scopeType", "scopeId");

ALTER TABLE "StoredValueLedger"
ADD COLUMN "issuerCampgroundId" TEXT,
ADD COLUMN "scopeType" "StoredValueScopeType" NOT NULL DEFAULT 'campground',
ADD COLUMN "scopeId" TEXT;

UPDATE "StoredValueLedger"
SET "scopeId" = "campgroundId",
    "issuerCampgroundId" = COALESCE("issuerCampgroundId", "campgroundId")
WHERE "scopeId" IS NULL;

CREATE INDEX "StoredValueLedger_scope_idx" ON "StoredValueLedger" ("scopeType", "scopeId");
CREATE INDEX "StoredValueLedger_issuerCampground_idx" ON "StoredValueLedger" ("issuerCampgroundId");
