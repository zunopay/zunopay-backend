
-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_senderId_fkey";

-- CreateTable
CREATE TABLE "Wallet" (
    "address" TEXT NOT NULL,
    "userId" INTEGER,
    "lastInteractedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("address")
);

INSERT INTO "Wallet" ("address", "userId", "lastInteractedAt")
SELECT "walletAddress", "id", NOW() FROM "User";

-- DropIndex
DROP INDEX "User_walletAddress_key";

-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "senderWalletAddress" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "walletAddress";

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_senderWalletAddress_fkey" FOREIGN KEY ("senderWalletAddress") REFERENCES "Wallet"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_receiverWalletAddress_fkey" FOREIGN KEY ("receiverWalletAddress") REFERENCES "Wallet"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
