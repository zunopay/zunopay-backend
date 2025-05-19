-- RenameEnum
ALTER TYPE "MerchantCategory" RENAME TO "ShopCategory";
ALTER TYPE "MerchantStatus" RENAME TO "ShopStatus";

-- Drop
ALTER TABLE "Merchant" DROP CONSTRAINT IF EXISTS "Merchant_userId_fkey";
DROP INDEX IF EXISTS "Merchant_userId_key";

-- RenameTable
ALTER TABLE "Merchant" RENAME TO "Shop";
ALTER TABLE "Shop" RENAME CONSTRAINT "Merchant_pkey" TO "Shop_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "Shop_userId_key" ON "Shop"("userId");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "RewardPointTask" ADD VALUE 'ShopOnboarding';

-- AlterEnum
ALTER TYPE "Role" Add VALUE 'Individual';
ALTER TYPE "Role" Add VALUE 'Member';

-- AlterEnum
ALTER TYPE "ShopStatus" Add VALUE 'Inactive';
ALTER TYPE "ShopStatus" Add VALUE 'Unverified';

-- DropForeignKey
ALTER TABLE "KeyWalletRegistry" DROP CONSTRAINT "KeyWalletRegistry_userId_fkey";

-- DropForeignKey
ALTER TABLE "KycVerifier" DROP CONSTRAINT "KycVerifier_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserKycVerification" DROP CONSTRAINT "UserKycVerification_registryId_fkey";

-- DropForeignKey
ALTER TABLE "UserKycVerification" DROP CONSTRAINT "UserKycVerification_verifierId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "nonce",
DROP COLUMN "region";

-- DropTable
DROP TABLE "KeyWalletRegistry";

-- DropTable
DROP TABLE "KycVerifier";

-- DropTable
DROP TABLE "UserKycVerification";

-- DropEnum
DROP TYPE "SupportedRegion";

