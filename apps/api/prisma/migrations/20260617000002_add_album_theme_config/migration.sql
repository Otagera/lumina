ALTER TABLE "album_settings"
  ADD COLUMN IF NOT EXISTS "theme_config" JSONB;
