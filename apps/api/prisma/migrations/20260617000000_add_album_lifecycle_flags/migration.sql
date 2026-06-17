-- AlterTable: add lifecycle phase flags and branding fields to album_settings
ALTER TABLE "album_settings"
  ADD COLUMN IF NOT EXISTS "curating" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "delivered" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "theme_preset" TEXT,
  ADD COLUMN IF NOT EXISTS "tagline" TEXT;
