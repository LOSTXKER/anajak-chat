-- CreateTable: message_sets
CREATE TABLE "message_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '{}',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "message_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bot_intents
CREATE TABLE "bot_intents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "trigger_type" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postback_data" TEXT,
    "message_set_id" UUID NOT NULL,
    "channel_id" UUID,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assign_to_human" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bot_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: intent_sessions
CREATE TABLE "intent_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "intent_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "variables" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "intent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_sets_org_id_idx" ON "message_sets"("org_id");
CREATE INDEX "bot_intents_org_id_is_active_idx" ON "bot_intents"("org_id", "is_active");
CREATE INDEX "intent_sessions_intent_id_conversation_id_idx" ON "intent_sessions"("intent_id", "conversation_id");
CREATE INDEX "intent_sessions_conversation_id_status_idx" ON "intent_sessions"("conversation_id", "status");

-- AddForeignKey
ALTER TABLE "message_sets" ADD CONSTRAINT "message_sets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bot_intents" ADD CONSTRAINT "bot_intents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bot_intents" ADD CONSTRAINT "bot_intents_message_set_id_fkey" FOREIGN KEY ("message_set_id") REFERENCES "message_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bot_intents" ADD CONSTRAINT "bot_intents_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "intent_sessions" ADD CONSTRAINT "intent_sessions_intent_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "bot_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "intent_sessions" ADD CONSTRAINT "intent_sessions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data from chat_flows → message_sets + bot_intents
INSERT INTO "message_sets" ("id", "org_id", "name", "messages", "created_by", "created_at", "updated_at")
SELECT "id", "org_id", "name", "steps", "created_by", "created_at", "updated_at"
FROM "chat_flows";

INSERT INTO "bot_intents" ("id", "org_id", "name", "is_active", "trigger_type", "keywords", "postback_data", "message_set_id", "channel_id", "priority", "assign_to_human", "created_by", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    "org_id",
    "name",
    "is_active",
    COALESCE(("trigger"::jsonb)->>'type', 'keyword'),
    COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(("trigger"::jsonb)->'keywords')),
        ARRAY[]::TEXT[]
    ),
    ("trigger"::jsonb)->>'data',
    "id",
    "channel_id",
    "priority",
    COALESCE((("steps"::jsonb)->>'assignToHuman')::boolean, false),
    "created_by",
    "created_at",
    "updated_at"
FROM "chat_flows";

-- Drop old tables
DROP TABLE IF EXISTS "flow_sessions" CASCADE;
DROP TABLE IF EXISTS "chat_flows" CASCADE;
