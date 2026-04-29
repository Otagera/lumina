/*
  Warnings:

  - You are about to drop the column `is_active` on the `user_storage_configs` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `user_storage_configs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[album_id,image_id]` on the table `album_images` will be added. If there are existing duplicate values, this will fail.
  - Made the column `image_id` on table `album_images` required. This step will fail if there are existing NULL values in that column.
  - Made the column `album_id` on table `album_images` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "album_images" DROP CONSTRAINT "album_images_album_id_fkey";

-- DropForeignKey
ALTER TABLE "album_images" DROP CONSTRAINT "album_images_image_id_fkey";

-- AlterTable
ALTER TABLE "album_images" ALTER COLUMN "image_id" SET NOT NULL,
ALTER COLUMN "album_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "album_settings" ADD COLUMN     "webhook_url" TEXT;

-- AlterTable
ALTER TABLE "albums" ADD COLUMN     "cover_image_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "images" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "file_hash" TEXT,
ADD COLUMN     "guest_session_id" UUID,
ADD COLUMN     "optimized_size" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "perceptual_hash" TEXT,
ADD COLUMN     "rejection_reason" TEXT;

-- AlterTable
ALTER TABLE "usage_logs" ADD COLUMN     "album_id" UUID,
ADD COLUMN     "metadata" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "user_storage_configs" DROP COLUMN "is_active",
DROP COLUMN "name",
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "provider" SET DEFAULT 'r2',
ALTER COLUMN "region" SET DEFAULT 'auto',
ALTER COLUMN "created_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_preferences" JSONB DEFAULT '{"welcome":true,"photoApproved":true,"clustering":true,"marketing":false}',
ADD COLUMN     "plan_id" UUID,
ADD COLUMN     "plan_name" TEXT NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "album_members" (
    "id" UUID NOT NULL,
    "album_id" UUID NOT NULL,
    "user_id" UUID,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "passcode" TEXT,
    "invite_token" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "album_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "album_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "storage_mb" INTEGER NOT NULL DEFAULT 5120,
    "compute_units_per_month" INTEGER NOT NULL DEFAULT 100,
    "price_usd" TEXT NOT NULL DEFAULT '0',
    "price_ngn" TEXT NOT NULL DEFAULT '0',
    "is_highlighted" BOOLEAN NOT NULL DEFAULT false,
    "features" JSONB DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "album_members_invite_token_key" ON "album_members"("invite_token");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "album_images_album_id_image_id_key" ON "album_images"("album_id", "image_id");

-- AddForeignKey
ALTER TABLE "album_images" ADD CONSTRAINT "album_images_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("album_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_images" ADD CONSTRAINT "album_images_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("image_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_members" ADD CONSTRAINT "album_members_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("album_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_members" ADD CONSTRAINT "album_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "images"("image_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("album_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
