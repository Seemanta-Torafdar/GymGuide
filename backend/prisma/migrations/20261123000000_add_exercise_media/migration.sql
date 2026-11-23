-- ============================================================================
-- GYMGUIDE - MINIO OBJECT STORAGE MEDIA METADATA MIGRATION (PostgreSQL)
-- Stores object keys, MIME metadata, dimensions & exercise relations only.
-- Binary files live exclusively in private MinIO S3 storage.
-- ============================================================================

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'IMAGE');

-- CreateTable
CREATE TABLE "exercise_media" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "step_number" INTEGER,
    "angle" TEXT DEFAULT 'front',
    "bucket" TEXT NOT NULL DEFAULT 'gymguide-media',
    "object_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "target_muscle_part" TEXT,
    "source_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_media_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exercise_media_step_check" CHECK (
      ("media_type" = 'IMAGE' AND "step_number" BETWEEN 1 AND 4)
      OR ("media_type" = 'VIDEO' AND "step_number" IS NULL)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "exercise_media_object_key_key" ON "exercise_media"("object_key");

-- CreateIndex (Prevents duplicate step numbers 1..4 per exercise)
CREATE UNIQUE INDEX "exercise_media_exercise_id_media_type_step_number_key"
  ON "exercise_media"("exercise_id", "media_type", "step_number");

-- CreateIndex
CREATE INDEX "exercise_media_exercise_id_idx" ON "exercise_media"("exercise_id");

-- CreateIndex
CREATE INDEX "exercise_media_media_type_idx" ON "exercise_media"("media_type");

-- CreateIndex
CREATE INDEX "exercise_media_object_key_idx" ON "exercise_media"("object_key");

-- AddForeignKey
ALTER TABLE "exercise_media"
  ADD CONSTRAINT "exercise_media_exercise_id_fkey"
  FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
