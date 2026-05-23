-- Track which semantic embedding model produced images.embedding.
-- Existing rows are legacy clip-ViT-B-32 vectors.
ALTER TABLE "images"
ADD COLUMN "embedding_model" TEXT DEFAULT 'clip-vit-b-32';
