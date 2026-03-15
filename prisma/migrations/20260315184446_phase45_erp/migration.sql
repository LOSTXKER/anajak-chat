-- CreateEnum
CREATE TYPE "SyncLogType" AS ENUM ('product_sync', 'customer_sync', 'order_push', 'webhook_order_status', 'webhook_stock_update', 'webhook_customer_update');

-- CreateEnum
CREATE TYPE "SyncLogStatus" AS ENUM ('success', 'failed');

-- CreateEnum
CREATE TYPE "SyncLogDirection" AS ENUM ('inbound', 'outbound');

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "type" "SyncLogType" NOT NULL,
    "direction" "SyncLogDirection" NOT NULL,
    "entity_id" TEXT,
    "status" "SyncLogStatus" NOT NULL,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_logs_org_id_type_idx" ON "sync_logs"("org_id", "type");

-- CreateIndex
CREATE INDEX "sync_logs_org_id_status_idx" ON "sync_logs"("org_id", "status");

-- CreateIndex
CREATE INDEX "sync_logs_org_id_created_at_idx" ON "sync_logs"("org_id", "created_at");
