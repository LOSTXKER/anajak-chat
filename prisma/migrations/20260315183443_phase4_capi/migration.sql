-- CreateEnum
CREATE TYPE "CapiEventStatus" AS ENUM ('pending', 'sent', 'failed', 'retrying');

-- CreateTable
CREATE TABLE "capi_datasets" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_entity_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capi_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capi_events" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "dataset_id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "action_source" TEXT NOT NULL DEFAULT 'business_messaging',
    "messaging_channel" TEXT NOT NULL,
    "user_data" JSONB NOT NULL DEFAULT '{}',
    "custom_data" JSONB NOT NULL DEFAULT '{}',
    "status" "CapiEventStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "conversation_id" UUID,
    "order_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capi_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "capi_datasets_org_id_idx" ON "capi_datasets"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "capi_datasets_channel_id_key" ON "capi_datasets"("channel_id");

-- CreateIndex
CREATE INDEX "capi_events_org_id_status_idx" ON "capi_events"("org_id", "status");

-- CreateIndex
CREATE INDEX "capi_events_org_id_event_name_idx" ON "capi_events"("org_id", "event_name");

-- CreateIndex
CREATE UNIQUE INDEX "capi_events_event_id_key" ON "capi_events"("event_id");

-- AddForeignKey
ALTER TABLE "capi_datasets" ADD CONSTRAINT "capi_datasets_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capi_events" ADD CONSTRAINT "capi_events_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "capi_datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
