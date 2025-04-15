-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'KycVerifier', 'Indiviual', 'Merchant');

-- CreateEnum
CREATE TYPE "SupportedRegion" AS ENUM ('EU');

-- CreateEnum
CREATE TYPE "OfframpProvider" AS ENUM ('SpherePay');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '',
    "role" "Role" NOT NULL DEFAULT 'Indiviual',
    "deletedAt" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "registryId" INTEGER,
    "nonce" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "region" "SupportedRegion" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycVerifier" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "KycVerifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantKycVerification" (
    "id" SERIAL NOT NULL,
    "verifierId" INTEGER NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantKycVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" SERIAL NOT NULL,
    "displayName" TEXT NOT NULL,
    "registryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyWalletRegistry" (
    "id" SERIAL NOT NULL,
    "commitment" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,

    CONSTRAINT "KeyWalletRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantOfframpProvider" (
    "id" SERIAL NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "walletAccountId" TEXT NOT NULL,
    "type" "OfframpProvider" NOT NULL,
    "kyb" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MerchantOfframpProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOfframpProvider" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "walletAccountId" TEXT NOT NULL,
    "offrampProvider" "OfframpProvider" NOT NULL,
    "kyc" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserOfframpProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_registryId_key" ON "User"("registryId");

-- CreateIndex
CREATE UNIQUE INDEX "KycVerifier_userId_key" ON "KycVerifier"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantKycVerification_merchantId_key" ON "MerchantKycVerification"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_registryId_key" ON "Merchant"("registryId");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_userId_key" ON "Merchant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KeyWalletRegistry_commitment_key" ON "KeyWalletRegistry"("commitment");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantOfframpProvider_merchantId_type_key" ON "MerchantOfframpProvider"("merchantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "UserOfframpProvider_userId_offrampProvider_key" ON "UserOfframpProvider"("userId", "offrampProvider");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "KeyWalletRegistry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycVerifier" ADD CONSTRAINT "KycVerifier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantKycVerification" ADD CONSTRAINT "MerchantKycVerification_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "KycVerifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantKycVerification" ADD CONSTRAINT "MerchantKycVerification_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "KeyWalletRegistry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantOfframpProvider" ADD CONSTRAINT "MerchantOfframpProvider_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOfframpProvider" ADD CONSTRAINT "UserOfframpProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
