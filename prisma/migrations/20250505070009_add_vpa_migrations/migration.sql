-- AlterTable
ALTER TABLE "KeyWalletRegistry" ADD COLUMN "vpa" TEXT;

-- UpdateTable
UPDATE "KeyWalletRegistry" SET "vpa" = 'example@ibl';

-- AlterTable
ALTER TABLE "KeyWalletRegistry" ALTER COLUMN "vpa" SET NOT NULL;