CREATE TABLE "contact_labels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_labels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contact_labels_org_id_name_key" ON "contact_labels"("org_id", "name");

ALTER TABLE "contact_labels" ADD CONSTRAINT "contact_labels_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
