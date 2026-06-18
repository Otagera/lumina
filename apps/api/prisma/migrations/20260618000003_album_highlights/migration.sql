CREATE TABLE IF NOT EXISTS "album_highlights" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "album_id" UUID NOT NULL,
  "image_ids" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "album_highlights_album_id_key" ON "album_highlights"("album_id");
