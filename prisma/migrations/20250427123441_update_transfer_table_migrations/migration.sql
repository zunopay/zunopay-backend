/*
  Warnings:

  - Added the required column `receiverWalletAddress` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reference` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_senderId_fkey";

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "receiverWalletAddress" TEXT NOT NULL,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "signature" TEXT,
ALTER COLUMN "senderId" DROP NOT NULL,
ALTER COLUMN "receiverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
