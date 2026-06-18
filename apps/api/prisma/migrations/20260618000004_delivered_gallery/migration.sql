ALTER TABLE "albums" ADD COLUMN IF NOT EXISTS "source_album_id" UUID REFERENCES "albums"("album_id") ON DELETE SET NULL;
ALTER TABLE "album_images" ADD COLUMN IF NOT EXISTS "position" INTEGER;
