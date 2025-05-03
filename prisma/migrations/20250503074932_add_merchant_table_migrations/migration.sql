-- CreateEnum
CREATE TYPE "MerchantCategory" AS ENUM ('Restraunt', 'Groceries');

-- CreateTable
CREATE TABLE "Merchant" (
    "id" SERIAL NOT NULL,
    "displayName" TEXT NOT NULL,
    "logo" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL,
    "category" "MerchantCategory" NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_userId_key" ON "Merchant"("userId");

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
