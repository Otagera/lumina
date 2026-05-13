-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "album_settings" ADD COLUMN     "semantic_search_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "images" ADD COLUMN     "embedding" vector(512);
