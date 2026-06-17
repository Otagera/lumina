-- Free-tier TTL: guest-uploaded images can be expired after 14 days.
ALTER TABLE "images"
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ;
