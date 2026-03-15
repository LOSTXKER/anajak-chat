-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "AiBotMode" AS ENUM ('off', 'confirm', 'full_auto');

-- CreateEnum
CREATE TYPE "AiReplyStatus" AS ENUM ('auto_sent', 'pending_review', 'approved', 'edited', 'rejected', 'escalated');

-- CreateEnum
CREATE TYPE "KbCategory" AS ENUM ('faq', 'product', 'policy', 'promotion', 'store_info', 'other');

-- CreateTable
CREATE TABLE "ai_bot_configs" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "channel_id" UUID,
    "mode" "AiBotMode" NOT NULL DEFAULT 'off',
    "use_business_hours" BOOLEAN NOT NULL DEFAULT false,
    "auto_mode" "AiBotMode" NOT NULL DEFAULT 'full_auto',
    "manual_mode" "AiBotMode" NOT NULL DEFAULT 'confirm',
    "persona" TEXT,
    "escalation_max_rounds" INTEGER NOT NULL DEFAULT 5,
    "escalation_on_negative_sentiment" BOOLEAN NOT NULL DEFAULT true,
    "escalation_on_refund" BOOLEAN NOT NULL DEFAULT true,
    "escalation_on_low_confidence" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    "greeting_message" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_bot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "KbCategory" NOT NULL DEFAULT 'faq',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_reply_logs" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "message_id" UUID,
    "mode" "AiBotMode" NOT NULL,
    "draft_content" TEXT NOT NULL,
    "final_content" TEXT,
    "status" "AiReplyStatus" NOT NULL DEFAULT 'pending_review',
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "should_escalate" BOOLEAN NOT NULL DEFAULT false,
    "escalate_reason" TEXT,
    "used_sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kb_article_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_reply_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_bot_configs_org_id_idx" ON "ai_bot_configs"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_bot_configs_org_id_channel_id_key" ON "ai_bot_configs"("org_id", "channel_id");

-- CreateIndex
CREATE INDEX "knowledge_articles_org_id_category_idx" ON "knowledge_articles"("org_id", "category");

-- CreateIndex
CREATE INDEX "knowledge_articles_org_id_is_active_idx" ON "knowledge_articles"("org_id", "is_active");

-- CreateIndex
CREATE INDEX "ai_reply_logs_org_id_status_idx" ON "ai_reply_logs"("org_id", "status");

-- CreateIndex
CREATE INDEX "ai_reply_logs_conversation_id_idx" ON "ai_reply_logs"("conversation_id");

-- CreateIndex
CREATE INDEX "ai_reply_logs_org_id_created_at_idx" ON "ai_reply_logs"("org_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_bot_configs" ADD CONSTRAINT "ai_bot_configs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add embedding column for pgvector (1536 dims for text-embedding-004)
ALTER TABLE "knowledge_articles" ADD COLUMN IF NOT EXISTS "embedding" vector(768);
CREATE INDEX IF NOT EXISTS "knowledge_articles_embedding_idx" ON "knowledge_articles" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

-- AddForeignKey
ALTER TABLE "ai_reply_logs" ADD CONSTRAINT "ai_reply_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_reply_logs" ADD CONSTRAINT "ai_reply_logs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
