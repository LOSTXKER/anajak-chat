-- Step 1: Add labels column (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'labels') THEN
    ALTER TABLE "conversations" ADD COLUMN "labels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

-- Step 2: Migrate data - convert label-statuses to proper status + labels
-- Cast to text first to avoid type issues with renamed enum
UPDATE "conversations" SET "labels" = ARRAY['follow_up'], "status" = 'resolved' WHERE "status"::text = 'follow_up';
UPDATE "conversations" SET "labels" = ARRAY['missed'], "status" = 'pending' WHERE "status"::text = 'missed';
UPDATE "conversations" SET "labels" = ARRAY['spam'], "status" = 'resolved' WHERE "status"::text = 'spam';
UPDATE "conversations" SET "labels" = ARRAY['blocked'], "status" = 'closed' WHERE "status"::text = 'blocked';
UPDATE "conversations" SET "status" = 'pending' WHERE "status"::text = 'expired';

-- Step 3: Remove session_deadline column
ALTER TABLE "conversations" DROP COLUMN IF EXISTS "session_deadline";

-- Step 4: Convert status column to text, drop all enum types, recreate clean enum
ALTER TABLE "conversations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "conversations" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
DROP TYPE IF EXISTS "ConversationStatus" CASCADE;
DROP TYPE IF EXISTS "ConversationStatus_old" CASCADE;
CREATE TYPE "ConversationStatus" AS ENUM ('pending', 'open', 'resolved', 'closed');
ALTER TABLE "conversations" ALTER COLUMN "status" TYPE "ConversationStatus" USING "status"::"ConversationStatus";
ALTER TABLE "conversations" ALTER COLUMN "status" SET DEFAULT 'open'::"ConversationStatus";
