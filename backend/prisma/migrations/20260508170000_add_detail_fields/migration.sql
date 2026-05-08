ALTER TABLE "DailyEntry"
  ADD COLUMN IF NOT EXISTS "intimacyQuality" INTEGER,
  ADD COLUMN IF NOT EXISTS "disgustCategory" TEXT,
  ADD COLUMN IF NOT EXISTS "detailType"       TEXT,
  ADD COLUMN IF NOT EXISTS "energyLevel"      INTEGER;
