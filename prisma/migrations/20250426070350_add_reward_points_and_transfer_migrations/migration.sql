-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('USDC');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('Success', 'Pending', 'Rejected');

-- CreateEnum
CREATE TYPE "RewardPointTask" AS ENUM ('MerchantOnboarding', 'EarlyUser');

-- CreateTable
CREATE TABLE "Transfer" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "tokenType" "TokenType" NOT NULL,
    "status" "TransferStatus" NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardPointSystem" (
    "id" SERIAL NOT NULL,
    "task" "RewardPointTask" NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "RewardPointSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRewardPoints" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rewardId" INTEGER NOT NULL,
    "targetId" INTEGER,

    CONSTRAINT "UserRewardPoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RewardPointSystem_task_key" ON "RewardPointSystem"("task");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRewardPoints" ADD CONSTRAINT "UserRewardPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRewardPoints" ADD CONSTRAINT "UserRewardPoints_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "RewardPointSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
