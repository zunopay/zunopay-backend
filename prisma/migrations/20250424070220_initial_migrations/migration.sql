-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'KycVerifier', 'Indiviual');

-- CreateEnum
CREATE TYPE "SupportedRegion" AS ENUM ('EU', 'IN', 'BR', 'SG');

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
    "walletAddress" TEXT,
    "nonce" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "region" "SupportedRegion" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "code" TEXT NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "refereeId" INTEGER
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
CREATE TABLE "UserKycVerification" (
    "id" SERIAL NOT NULL,
    "verifierId" INTEGER NOT NULL,
    "registryId" INTEGER NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserKycVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyWalletRegistry" (
    "id" SERIAL NOT NULL,
    "commitment" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "KeyWalletRegistry_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_refereeId_key" ON "ReferralCode"("refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "KycVerifier_userId_key" ON "KycVerifier"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserKycVerification_registryId_key" ON "UserKycVerification"("registryId");

-- CreateIndex
CREATE UNIQUE INDEX "KeyWalletRegistry_userId_key" ON "KeyWalletRegistry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOfframpProvider_userId_offrampProvider_key" ON "UserOfframpProvider"("userId", "offrampProvider");

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycVerifier" ADD CONSTRAINT "KycVerifier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKycVerification" ADD CONSTRAINT "UserKycVerification_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "KycVerifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKycVerification" ADD CONSTRAINT "UserKycVerification_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "KeyWalletRegistry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyWalletRegistry" ADD CONSTRAINT "KeyWalletRegistry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOfframpProvider" ADD CONSTRAINT "UserOfframpProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
