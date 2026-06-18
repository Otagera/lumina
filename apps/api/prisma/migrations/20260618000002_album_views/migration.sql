CREATE TABLE IF NOT EXISTS "album_views" (
  "id" SERIAL PRIMARY KEY,
  "album_id" UUID NOT NULL,
  "session_hash" TEXT,
  "view_type" TEXT NOT NULL DEFAULT 'page_view',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "album_views_album_id_created_at_idx" ON "album_views"("album_id", "created_at");
