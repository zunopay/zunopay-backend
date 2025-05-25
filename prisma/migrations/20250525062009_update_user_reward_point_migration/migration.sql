-- Alter Enum
ALTER TYPE "RewardPointTask" ADD VALUE IF NOT EXISTS 'Shopping';

-- Drop Foreign Keys
ALTER TABLE "UserRewardPoints" DROP CONSTRAINT IF EXISTS "UserRewardPoints_rewardId_fkey";

-- Drop Column
ALTER TABLE "UserRewardPoints" DROP COLUMN IF EXISTS "rewardId";

-- Drop Old Table
DROP TABLE IF EXISTS "RewardPointSystem";

-- Rename Table
ALTER TABLE "UserRewardPoints" RENAME CONSTRAINT "UserRewardPoints_userId_fkey" TO "UserRewardPoint_userId_fkey";
ALTER TABLE "UserRewardPoints" RENAME TO "UserRewardPoint";

-- Alter Table: Add Columns
ALTER TABLE "UserRewardPoint" 
  ADD COLUMN IF NOT EXISTS "value" INTEGER,
  ADD COLUMN IF NOT EXISTS "task" "RewardPointTask";


-- Rename Primary Key Constraint
ALTER TABLE "UserRewardPoint" RENAME CONSTRAINT "UserRewardPoints_pkey" TO "UserRewardPoint_pkey";

-- Update existing rows
UPDATE "UserRewardPoint" 
SET "value" = 3, 
    "task" = 'EarlyUser'
WHERE "task" IS NULL;

-- Set NOT NULL Constraints
ALTER TABLE "UserRewardPoint" 
ALTER COLUMN "task" SET NOT NULL,
ALTER COLUMN "value" SET NOT NULL;
