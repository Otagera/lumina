-- CreateTable
CREATE TABLE "reactions" (
    "id" UUID NOT NULL,
    "image_id" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'HEART',
    "user_id" UUID,
    "guest_session_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("image_id") ON DELETE CASCADE ON UPDATE CASCADE;
