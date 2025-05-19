-- Fix incorrect enum values
UPDATE "User" SET "role" = 'Individual' WHERE "role" = 'Indiviual';
UPDATE "User" SET "role" = 'Member' WHERE "role" = 'KycVerifier';

UPDATE "RewardPointSystem" SET "task" = 'ShopOnboarding' WHERE "task" = 'MerchantOnboarding';

-- Migrate Role enum
BEGIN;

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

CREATE TYPE "Role_new" AS ENUM ('Admin', 'Member', 'Individual', 'Merchant');

ALTER TABLE "User" 
ALTER COLUMN "role" 
TYPE "Role_new" 
USING ("role"::text::"Role_new");

ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'Individual';

DROP TYPE "Role_old";

COMMIT;

-- Migrate RewardPointTask enum
BEGIN;

CREATE TYPE "RewardPointTask_new" AS ENUM ('ShopOnboarding', 'EarlyUser', 'UserReferred');

ALTER TABLE "RewardPointSystem" 
ALTER COLUMN "task" 
TYPE "RewardPointTask_new" 
USING ("task"::text::"RewardPointTask_new");

ALTER TYPE "RewardPointTask" RENAME TO "RewardPointTask_old";
ALTER TYPE "RewardPointTask_new" RENAME TO "RewardPointTask";

DROP TYPE "RewardPointTask_old";

COMMIT;


-- Migrate ShopStatus enum
BEGIN;
ALTER TABLE "Shop" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "ShopStatus_new" AS ENUM ('Active', 'Unverified', 'Upcoming', 'Inactive');

ALTER TABLE "Shop" ALTER COLUMN "status" TYPE "ShopStatus_new" USING ("status"::text::"ShopStatus_new");

ALTER TYPE "ShopStatus" RENAME TO "ShopStatus_old";
ALTER TYPE "ShopStatus_new" RENAME TO "ShopStatus";

ALTER TABLE "Shop" ALTER COLUMN "status" SET DEFAULT 'Unverified';

DROP TYPE "ShopStatus_old";

COMMIT;
