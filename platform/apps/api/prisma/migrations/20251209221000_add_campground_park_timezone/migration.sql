-- Add parkTimeZone column to Campground if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Campground' AND column_name = 'parkTimeZone'
  ) THEN
    ALTER TABLE "Campground" ADD COLUMN "parkTimeZone" TEXT;
  END IF;
END
$$;

