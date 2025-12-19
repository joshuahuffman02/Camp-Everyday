-- Add site map shapes and assignments
CREATE TABLE IF NOT EXISTS "SiteMapShape" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT,
    "geometry" JSONB NOT NULL,
    "centroid" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteMapShape_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SiteMapAssignment" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "shapeId" TEXT NOT NULL,
    "label" TEXT,
    "rotation" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteMapAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SiteMapAssignment_siteId_key" ON "SiteMapAssignment"("siteId");
CREATE UNIQUE INDEX IF NOT EXISTS "SiteMapAssignment_shapeId_key" ON "SiteMapAssignment"("shapeId");
CREATE INDEX IF NOT EXISTS "SiteMapShape_campgroundId_idx" ON "SiteMapShape"("campgroundId");
CREATE INDEX IF NOT EXISTS "SiteMapAssignment_campgroundId_idx" ON "SiteMapAssignment"("campgroundId");

DO $$ BEGIN
  ALTER TABLE "SiteMapShape"
    ADD CONSTRAINT "SiteMapShape_campgroundId_fkey"
    FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SiteMapAssignment"
    ADD CONSTRAINT "SiteMapAssignment_campgroundId_fkey"
    FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SiteMapAssignment"
    ADD CONSTRAINT "SiteMapAssignment_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SiteMapAssignment"
    ADD CONSTRAINT "SiteMapAssignment_shapeId_fkey"
    FOREIGN KEY ("shapeId") REFERENCES "SiteMapShape"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
