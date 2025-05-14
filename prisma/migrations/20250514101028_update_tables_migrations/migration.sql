/*
  Warnings:

  - The values [InActive] on the enum `MerchantStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [KycVerifier] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `refereeId` on the `ReferralCode` table. All the data in the column will be lost.
  - You are about to drop the column `nonce` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `KeyWalletRegistry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KycVerifier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserKycVerification` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[merchantId]` on the table `ReferralCode` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MerchantStatus_new" AS ENUM ('Active', 'Unverified', 'Upcoming', 'Inactive');
ALTER TABLE "Merchant" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Merchant" ALTER COLUMN "status" TYPE "MerchantStatus_new" USING ("status"::text::"MerchantStatus_new");
ALTER TYPE "MerchantStatus" RENAME TO "MerchantStatus_old";
ALTER TYPE "MerchantStatus_new" RENAME TO "MerchantStatus";
DROP TYPE "MerchantStatus_old";
ALTER TABLE "Merchant" ALTER COLUMN "status" SET DEFAULT 'Unverified';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('Admin', 'Member', 'Indiviual', 'Merchant');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'Indiviual';
COMMIT;

-- DropForeignKey
ALTER TABLE "KeyWalletRegistry" DROP CONSTRAINT "KeyWalletRegistry_userId_fkey";

-- DropForeignKey
ALTER TABLE "KycVerifier" DROP CONSTRAINT "KycVerifier_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReferralCode" DROP CONSTRAINT "ReferralCode_refereeId_fkey";

-- DropForeignKey
ALTER TABLE "UserKycVerification" DROP CONSTRAINT "UserKycVerification_registryId_fkey";

-- DropForeignKey
ALTER TABLE "UserKycVerification" DROP CONSTRAINT "UserKycVerification_verifierId_fkey";

-- DropIndex
DROP INDEX "ReferralCode_refereeId_key";

-- AlterTable
ALTER TABLE "Merchant" ALTER COLUMN "status" SET DEFAULT 'Unverified';

-- AlterTable
ALTER TABLE "ReferralCode" DROP COLUMN "refereeId",
ADD COLUMN     "merchantId" INTEGER;

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

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_merchantId_key" ON "ReferralCode"("merchantId");

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
