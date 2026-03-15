-- CreateEnum
CREATE TYPE "NoteableType" AS ENUM ('conversation', 'contact');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('image', 'video', 'pdf', 'document', 'other');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('greeting', 'pricing', 'shipping', 'closing', 'custom');

-- CreateTable
CREATE TABLE "quick_reply_templates" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL DEFAULT 'custom',
    "shortcut" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quick_reply_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "noteable_type" "NoteableType" NOT NULL,
    "noteable_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" UUID[] DEFAULT ARRAY[]::UUID[],
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_folders" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "folder_id" UUID,
    "original_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_type" "FileType" NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "thumbnail_key" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "alt_text" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quick_reply_templates_org_id_category_idx" ON "quick_reply_templates"("org_id", "category");

-- CreateIndex
CREATE INDEX "notes_org_id_noteable_type_noteable_id_idx" ON "notes"("org_id", "noteable_type", "noteable_id");

-- CreateIndex
CREATE INDEX "media_folders_org_id_parent_id_idx" ON "media_folders"("org_id", "parent_id");

-- CreateIndex
CREATE INDEX "media_files_org_id_folder_id_idx" ON "media_files"("org_id", "folder_id");

-- CreateIndex
CREATE INDEX "media_files_org_id_file_type_idx" ON "media_files"("org_id", "file_type");

-- AddForeignKey
ALTER TABLE "quick_reply_templates" ADD CONSTRAINT "quick_reply_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
