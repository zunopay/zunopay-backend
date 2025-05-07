-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('Active', 'Upcoming', 'InActive');

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "status" "MerchantStatus" NOT NULL DEFAULT 'Upcoming';
